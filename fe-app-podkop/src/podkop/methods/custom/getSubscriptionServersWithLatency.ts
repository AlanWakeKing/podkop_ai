import { getConfigSections } from './getConfigSections';
import { Podkop } from '../../types';
import { PodkopShellMethods } from '../shell';

export interface ISubscriptionServerRow {
  code: string;
  displayName: string;
  latency: number;
}

export interface ISubscriptionLocationCard {
  code: string;
  displayName: string;
  bestLatency: number;
  servers: ISubscriptionServerRow[];
}

export interface ISubscriptionSectionData {
  code: string;
  displayName: string;
  info: Podkop.SubscriptionInfo;
  locations: ISubscriptionLocationCard[];
}

interface IGetSubscriptionServersResponse {
  success: boolean;
  data: ISubscriptionSectionData[];
}

const LOCATION_SLUG_PATTERN = /-(loc\d+)-urltest-out$/;

async function getSubscriptionSections() {
  const configSections = await getConfigSections();

  return configSections.filter(
    (
      section,
    ): section is Podkop.ConfigSection & {
      proxy_config_type: 'subscription';
    } =>
      section.connection_type === 'proxy' &&
      section.proxy_config_type === 'subscription',
  );
}

async function buildSectionData(
  section: Podkop.ConfigSection,
  proxies: Record<string, { history?: { delay: number }[] }>,
): Promise<ISubscriptionSectionData> {
  const [serversResponse, locationsResponse, infoResponse] =
    await Promise.all([
      PodkopShellMethods.getSubscriptionServers(section['.name']),
      PodkopShellMethods.getSubscriptionLocations(section['.name']),
      PodkopShellMethods.getSubscriptionInfo(section['.name']),
    ]);

  const servers = serversResponse.success ? serversResponse.data : [];
  const locationNames = locationsResponse.success
    ? locationsResponse.data
    : {};
  const info = infoResponse.success
    ? infoResponse.data
    : { title: '', upload: 0, download: 0, total: 0, expire: 0 };

  const locationsByTag = new Map<string, ISubscriptionLocationCard>();

  servers.forEach((server) => {
    if (!locationsByTag.has(server.location_tag)) {
      const slug = server.location_tag.match(LOCATION_SLUG_PATTERN)?.[1];
      locationsByTag.set(server.location_tag, {
        code: server.location_tag,
        displayName:
          (slug && locationNames[slug]) || server.location_tag,
        bestLatency: 0,
        servers: [],
      });
    }

    const latency = proxies[server.tag]?.history?.[0]?.delay || 0;

    locationsByTag.get(server.location_tag)!.servers.push({
      code: server.tag,
      displayName: server.remarks,
      latency,
    });
  });

  const locations = Array.from(locationsByTag.values()).map((location) => {
    const sortedServers = [...location.servers].sort((a, b) => {
      if (a.latency === 0 && b.latency === 0) return 0;
      if (a.latency === 0) return 1;
      if (b.latency === 0) return -1;
      return a.latency - b.latency;
    });

    return {
      ...location,
      servers: sortedServers,
      bestLatency: sortedServers.find((server) => server.latency > 0)
        ?.latency || 0,
    };
  });

  return {
    code: section['.name'],
    displayName: section['.name'],
    info,
    locations,
  };
}

// Passive read: lists every subscription server (grouped by location) alongside whatever latency the
// Clash API already has cached from the last test (if any), plus subscription title/traffic/expiry.
// Does NOT trigger a new network probe, so it's cheap enough to call on every tab mount without
// loading the router.
export async function getSubscriptionServers(): Promise<IGetSubscriptionServersResponse> {
  const subscriptionSections = await getSubscriptionSections();

  if (subscriptionSections.length === 0) {
    return { success: true, data: [] };
  }

  const clashProxies = await PodkopShellMethods.getClashApiProxies();
  const proxies = clashProxies.success ? clashProxies.data.proxies : {};

  const data = await Promise.all(
    subscriptionSections.map((section) => buildSectionData(section, proxies)),
  );

  return { success: true, data };
}

// Active probe: triggers a real Clash API latency test for every location's urltest group (a handful
// of calls, one per location - each group test probes all its member servers in one shot, which is
// far cheaper than testing every server individually, but each call still does real network I/O and
// can take a while - only call this from an explicit user action, e.g. a "Test latency" button, never
// automatically on mount, since running it for every location at once can noticeably slow the router
// down for other unrelated requests for tens of seconds.
export async function testSubscriptionServersLatency(): Promise<IGetSubscriptionServersResponse> {
  const subscriptionSections = await getSubscriptionSections();

  if (subscriptionSections.length === 0) {
    return { success: true, data: [] };
  }

  const serversBySection = await Promise.all(
    subscriptionSections.map(async (section) => {
      const response = await PodkopShellMethods.getSubscriptionServers(
        section['.name'],
      );
      return response.success ? response.data : [];
    }),
  );

  const locationTags = new Set<string>();
  serversBySection.forEach((servers) => {
    servers.forEach((server) => locationTags.add(server.location_tag));
  });

  await Promise.all(
    Array.from(locationTags).map((tag) =>
      PodkopShellMethods.getClashApiGroupLatency(tag),
    ),
  );

  return getSubscriptionServers();
}
