# Handling of Xray/v2rayNG-style JSON subscriptions ("Subscription URL" proxy configuration type).
#
# A subscription endpoint returns a JSON array of profile objects (each a full Xray client config
# with its own dns/routing/inbounds/outbounds). We only need, per profile: its display name
# (`.remarks`) and its "real" outbound(s) (protocol != freedom/blackhole). Balancer profiles
# (multiple real outbounds bundled together) and XHTTP-transport profiles are skipped in this
# version to keep the server list small and predictable.
#
# The HTTP response also carries two conventional headers used by v2rayNG/Clash-style clients:
#   profile-update-interval: <hours>            - how often the subscription should be re-fetched
#   subscription-userinfo: ...expire=<unix ts>  - when the subscription stops being valid (0 = never)

SUBSCRIPTION_PROFILE_EXCLUDE_KEYWORDS="balanser,xhttp"
SUBSCRIPTION_DEFAULT_UPDATE_INTERVAL_HOURS=3

subscription_cache_json_path() {
    local section="$1"

    echo "$TMP_SING_BOX_FOLDER/subscription-$section.json"
}

subscription_cache_headers_path() {
    local section="$1"

    echo "$TMP_SING_BOX_FOLDER/subscription-$section.headers"
}

#######################################
# Downloads a subscription URL, saving the JSON body and response headers to fixed cache paths for
# the given section. On failure, the previous cache (if any) is left untouched so callers can fall
# back to the last known-good server list.
# Arguments:
#   section: string, UCI section name the subscription belongs to
#   url: string, subscription URL
# Returns:
#   0 on success, 1 on download or validation failure
#######################################
subscription_fetch() {
    local section="$1"
    local url="$2"

    local json_path headers_path tmp_json tmp_headers
    json_path="$(subscription_cache_json_path "$section")"
    headers_path="$(subscription_cache_headers_path "$section")"
    tmp_json="$(mktemp)"
    tmp_headers="$(mktemp)"

    # OpenWrt's default "wget" is the uclient-fetch shim, which doesn't support reading response
    # headers (-S). curl is a hard dependency of this package, so use it instead.
    local curl_error curl_exit_code
    curl_error="$(curl -fsS -m 30 -D "$tmp_headers" -o "$tmp_json" "$url" 2>&1 > /dev/null)"
    curl_exit_code=$?
    if [ "$curl_exit_code" -ne 0 ]; then
        log "Failed to download subscription for section '$section' from '$url' (curl exit code $curl_exit_code: $curl_error)" \
            "error"
        rm -f "$tmp_json" "$tmp_headers"
        return 1
    fi

    if ! jq -e 'type == "array" and length > 0' "$tmp_json" > /dev/null 2>&1; then
        log "Subscription for section '$section' did not return a valid JSON array (expired or malformed link?)" \
            "error"
        rm -f "$tmp_json" "$tmp_headers"
        return 1
    fi

    mv "$tmp_json" "$json_path"
    mv "$tmp_headers" "$headers_path"

    return 0
}

# Reads the "profile-update-interval" response header (hours) from the cached headers file, falling
# back to SUBSCRIPTION_DEFAULT_UPDATE_INTERVAL_HOURS if absent or not a positive integer.
subscription_get_update_interval_hours() {
    local section="$1"

    local headers_path interval
    headers_path="$(subscription_cache_headers_path "$section")"

    if [ -f "$headers_path" ]; then
        interval="$(grep -i '^ *profile-update-interval:' "$headers_path" | tail -n1 | awk -F: '{gsub(/ /,"",$2); print $2}')"
    fi

    case "$interval" in
    '' | *[!0-9]*)
        echo "$SUBSCRIPTION_DEFAULT_UPDATE_INTERVAL_HOURS"
        ;;
    0)
        echo "$SUBSCRIPTION_DEFAULT_UPDATE_INTERVAL_HOURS"
        ;;
    *)
        echo "$interval"
        ;;
    esac
}

# Reads the "expire" field of the "subscription-userinfo" response header (unix timestamp, 0 = never
# expires). Echoes an empty string if the header is absent.
subscription_get_expire_timestamp() {
    local section="$1"

    local headers_path
    headers_path="$(subscription_cache_headers_path "$section")"

    [ -f "$headers_path" ] || return 0

    grep -i '^ *subscription-userinfo:' "$headers_path" | tail -n1 \
        | grep -o 'expire=[0-9]*' | head -n1 | cut -d= -f2
}

#######################################
# Parses the cached subscription JSON into a flat list of proxy servers grouped by location, printed
# as tab-separated "location_key<TAB>proxy_url" lines (one per usable server).
#
# location_key is derived from the profile's `remarks` field by taking the leading flag emoji plus
# the first following word, ignoring everything else (transport variant, instance numbering, typos
# like "GRCP"/"NY") - this intentionally groups every transport/duplicate of the same place under one
# key, e.g. "🇩🇪 Germany", "🇩🇪 Germany HY", "🇩🇪 Germany GRPC" all become "🇩🇪 Germany".
#
# Supported source protocols: vless (tcp/grpc, tls/reality) and hysteria (v2). Unsupported protocols
# are silently skipped. Profiles matching SUBSCRIPTION_PROFILE_EXCLUDE_REGEX (case-insensitive, e.g.
# balancer bundles or xhttp-transport variants) are skipped entirely.
# Arguments:
#   section: string, UCI section name
# Outputs:
#   Tab-separated "location_key<TAB>url<TAB>remarks" lines on stdout
#######################################
subscription_list_servers() {
    local section="$1"

    local json_path
    json_path="$(subscription_cache_json_path "$section")"
    [ -f "$json_path" ] || return 1

    # Deliberately avoids jq's regex builtins (test/match/gsub/splits) - some OpenWrt jq builds ship
    # without the oniguruma regex module, in which case those calls fail silently mid-pipeline and
    # the whole filter produces no output. Only plain string ops (contains, split(str), ascii_downcase,
    # slicing) are used here, all of which work on any jq 1.6+ build.
    jq -r --arg exclude_keywords "$SUBSCRIPTION_PROFILE_EXCLUDE_KEYWORDS" '
        ($exclude_keywords | split(",")) as $exclude_keywords |

        def urienc: @uri;

        def is_excluded_profile:
            (.remarks // "" | ascii_downcase) as $r |
            any($exclude_keywords[]; . as $keyword | $r | contains($keyword));

        def xray_outbound_to_url:
            .protocol as $proto |
            if $proto == "vless" then
                .settings.vnext[0] as $v |
                .streamSettings as $ss |
                ($ss.network // "tcp") as $net |
                ($ss.security // "none") as $sec |
                ($v.users[0].flow // "") as $flow |
                ($v.users[0].id) as $uuid |
                ($sec == "reality") as $isReality |
                (if $isReality then $ss.realitySettings else $ss.tlsSettings end) as $tls |
                "vless://" + $uuid + "@" + $v.address + ":" + ($v.port | tostring)
                    + "?security=" + $sec
                    + "&type=" + $net
                    + (if $flow != "" then "&flow=" + ($flow | urienc) else "" end)
                    + (if $tls.serverName then "&sni=" + ($tls.serverName | urienc) else "" end)
                    + (if $tls.fingerprint then "&fp=" + ($tls.fingerprint | urienc) else "" end)
                    + (if $isReality and $tls.publicKey then "&pbk=" + ($tls.publicKey | urienc) else "" end)
                    + (if $isReality and $tls.shortId then "&sid=" + ($tls.shortId | urienc) else "" end)
                    + (if $net == "grpc" and $ss.grpcSettings.serviceName then
                        "&serviceName=" + ($ss.grpcSettings.serviceName | urienc)
                       else "" end)
            elif $proto == "hysteria" then
                .settings as $s |
                .streamSettings as $ss |
                "hysteria2://" + ($ss.hysteriaSettings.auth) + "@" + $s.address + ":" + ($s.port | tostring)
                    + "?sni=" + ($ss.tlsSettings.serverName // "" | urienc)
            else
                empty
            end;

        def location_key:
            (.remarks // "" | split(" ") | map(select(length > 0))) as $tokens |
            (($tokens[0] // "") + " " + ($tokens[1] // ""));

        .[]
        | select(is_excluded_profile | not)
        | . as $profile
        | (location_key) as $loc
        | ($profile.outbounds[]? | select(.protocol == "vless" or .protocol == "hysteria")) as $ob
        | ($ob | xray_outbound_to_url) as $url
        | select($url != null and $url != "")
        | [$loc, $url, ($profile.remarks // "")]
        | @tsv
    ' "$json_path"
}

# Prints the distinct, ordered location keys found in the cached subscription for the section.
subscription_list_locations() {
    local section="$1"

    subscription_list_servers "$section" | cut -f1 | awk '!seen[$0]++'
}

#######################################
# Emits a JSON object mapping location outbound-tag slugs (loc1, loc2, ...) to their human-readable
# location key, in the same order used by sing_box_cf_add_subscription_outbounds - this lets the UI
# show a readable name for each "${section}-locN-urltest-out" outbound tag.
# Arguments:
#   section: string, UCI section name
# Outputs:
#   JSON object on stdout, e.g. {"loc1":"🇷🇺 Moscow","loc2":"🇩🇪 Germany"}
#######################################
subscription_locations_json() {
    local section="$1"

    local location index first
    index=0
    first=1
    printf '{'
    while IFS= read -r location; do
        [ -z "$location" ] && continue
        index=$((index + 1))
        if [ "$first" -eq 1 ]; then
            first=0
        else
            printf ','
        fi
        printf '"loc%d":%s' "$index" "$(printf '%s' "$location" | jq -R .)"
    done << EOF
$(subscription_list_locations "$section")
EOF
    printf '}'
}

#######################################
# Builds sing-box outbounds for a subscription-based proxy section: one urltest+individual-server
# outbound set per location, plus an outer selector across all locations (default = first location's
# urltest tag), mirroring the existing "urltest" proxy_config_type but with servers grouped by
# location instead of a single flat list.
#
# Callers MUST verify `subscription_list_locations "$section"` is non-empty before calling this -
# this function is normally invoked as `config="$(sing_box_cf_add_subscription_outbounds ...)"`,
# i.e. inside a command substitution subshell, where `exit` would only terminate that subshell and
# not the parent podkop process, silently continuing with a truncated config.
# Arguments:
#   config: string (JSON), sing-box configuration to modify
#   section: string, UCI section name
# Outputs:
#   Writes updated JSON configuration to stdout
#######################################
sing_box_cf_add_subscription_outbounds() {
    local config="$1"
    local section="$2"
    local udp_over_tcp="$3"
    local urltest_check_interval="$4"
    local urltest_tolerance="$5"
    local urltest_testing_url="$6"

    local location location_tags location_index server_index server_url
    local location_urltest_tag location_outbound_tags outer_selector_tags default_outbound

    location_index=0
    outer_selector_tags=""
    default_outbound=""

    while IFS= read -r location; do
        [ -z "$location" ] && continue
        location_index=$((location_index + 1))
        local location_slug="loc$location_index"

        server_index=0
        location_outbound_tags=""
        # shellcheck disable=SC2034 # server_remarks is unused here, only needed by subscription_servers_json
        while IFS=$'\t' read -r server_location server_url server_remarks; do
            [ "$server_location" = "$location" ] || continue
            server_index=$((server_index + 1))
            local server_section="$section-$location_slug-$server_index"
            config="$(sing_box_cf_add_proxy_outbound "$config" "$server_section" "$server_url" "$udp_over_tcp")"
            local server_tag
            server_tag="$(get_outbound_tag_by_section "$server_section")"
            if [ -z "$location_outbound_tags" ]; then
                location_outbound_tags="$server_tag"
            else
                location_outbound_tags="$location_outbound_tags,$server_tag"
            fi
        done << EOF
$(subscription_list_servers "$section")
EOF

        [ -z "$location_outbound_tags" ] && continue

        location_urltest_tag="$(get_outbound_tag_by_section "$section-$location_slug-urltest")"
        config="$(sing_box_cm_add_urltest_outbound "$config" "$location_urltest_tag" \
            "$(comma_string_to_json_array "$location_outbound_tags")" \
            "$urltest_testing_url" "$urltest_check_interval" "$urltest_tolerance")"

        if [ -z "$outer_selector_tags" ]; then
            outer_selector_tags="$location_urltest_tag"
            default_outbound="$location_urltest_tag"
        else
            outer_selector_tags="$outer_selector_tags,$location_urltest_tag"
        fi
    done << EOF
$(subscription_list_locations "$section")
EOF

    local outer_selector_tag
    outer_selector_tag="$(get_outbound_tag_by_section "$section")"
    config="$(sing_box_cm_add_selector_outbound "$config" "$outer_selector_tag" \
        "$(comma_string_to_json_array "$outer_selector_tags")" "$default_outbound")"

    echo "$config"
}

#######################################
# Emits a JSON array describing every individual server sing_box_cf_add_subscription_outbounds would
# build outbounds for, as {"tag": "...", "location_tag": "...", "remarks": "..."} objects - lets the
# UI list all servers (not just one entry per location) alongside their Clash API latency.
#
# The tag-assignment logic here (location index -> "locN", server index within location -> "locN-M")
# must stay in sync with sing_box_cf_add_subscription_outbounds, since it produces the exact same tags.
# Arguments:
#   section: string, UCI section name
# Outputs:
#   JSON array on stdout
#######################################
subscription_servers_json() {
    local section="$1"

    local location location_index server_index server_location server_url server_remarks first
    first=1
    location_index=0

    printf '['
    while IFS= read -r location; do
        [ -z "$location" ] && continue
        location_index=$((location_index + 1))
        local location_slug="loc$location_index"
        local location_urltest_tag
        location_urltest_tag="$(get_outbound_tag_by_section "$section-$location_slug-urltest")"

        server_index=0
        while IFS=$'\t' read -r server_location server_url server_remarks; do
            [ "$server_location" = "$location" ] || continue
            server_index=$((server_index + 1))
            local server_tag
            server_tag="$(get_outbound_tag_by_section "$section-$location_slug-$server_index")"

            if [ "$first" -eq 1 ]; then
                first=0
            else
                printf ','
            fi
            printf '{"tag":%s,"location_tag":%s,"remarks":%s}' \
                "$(printf '%s' "$server_tag" | jq -R .)" \
                "$(printf '%s' "$location_urltest_tag" | jq -R .)" \
                "$(printf '%s' "$server_remarks" | jq -R .)"
        done << EOF
$(subscription_list_servers "$section")
EOF
    done << EOF
$(subscription_list_locations "$section")
EOF
    printf ']'
}
