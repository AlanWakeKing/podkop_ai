import { getConfigSections } from './getConfigSections';
import { Podkop } from '../../types';
import { PodkopShellMethods } from '../shell';

export interface ISubscriptionServerRow {
  code: string;
  displayName: string;
  latency: number;
  selected: boolean;
}

export interface ISubscriptionSectionRows {
  code: string;
  displayName: string;
  servers: ISubscriptionServerRow[];
}

interface IGetSubscriptionServersResponse {
  success: boolean;
  data: ISubscriptionSectionRows[];
}

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

// Passive read: lists every subscription server alongside whatever latency the Clash API already has
// cached from the last test (if any). Does NOT trigger a new network probe, so it's cheap enough to
// call on every tab mount without loading the router.
export async function getSubscriptionServers(): Promise<IGetSubscriptionServersResponse> {
  const subscriptionSections = await getSubscriptionSections();

  if (subscriptionSections.length === 0) {
    return { success: true, data: [] };
  }

  const serversBySection = await Promise.all(
    subscriptionSections.map(async (section) => {
      const response = await PodkopShellMethods.getSubscriptionServers(
        section['.name'],
      );
      return {
        section,
        servers: response.success ? response.data : [],
      };
    }),
  );

  const clashProxies = await PodkopShellMethods.getClashApiProxies();
  const proxies = clashProxies.success ? clashProxies.data.proxies : {};

  const data = serversBySection.map(({ section, servers }) =>
    buildSectionRows(section, servers, proxies),
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
      return {
        section,
        servers: response.success ? response.data : [],
      };
    }),
  );

  const locationTags = new Set<string>();
  serversBySection.forEach(({ servers }) => {
    servers.forEach((server) => locationTags.add(server.location_tag));
  });

  await Promise.all(
    Array.from(locationTags).map((tag) =>
      PodkopShellMethods.getClashApiGroupLatency(tag),
    ),
  );

  const clashProxies = await PodkopShellMethods.getClashApiProxies();
  const proxies = clashProxies.success ? clashProxies.data.proxies : {};

  const data = serversBySection.map(({ section, servers }) =>
    buildSectionRows(section, servers, proxies),
  );

  return { success: true, data };
}

function buildSectionRows(
  section: Podkop.ConfigSection,
  servers: Podkop.SubscriptionServer[],
  proxies: Record<string, { history?: { delay: number }[] }>,
): ISubscriptionSectionRows {
  const rows = servers
    .map((server) => {
      const proxy = proxies[server.tag];
      return {
        code: server.tag,
        displayName: server.remarks,
        latency: proxy?.history?.[0]?.delay || 0,
        selected: false,
      };
    })
    .sort((a, b) => {
      if (a.latency === 0 && b.latency === 0) return 0;
      if (a.latency === 0) return 1;
      if (b.latency === 0) return -1;
      return a.latency - b.latency;
    });

  return {
    code: section['.name'],
    displayName: section['.name'],
    servers: rows,
  };
}
