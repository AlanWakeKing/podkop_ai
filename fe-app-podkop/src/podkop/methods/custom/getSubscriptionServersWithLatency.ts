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

// Triggers a Clash API latency test for every location's urltest group (a handful of calls, one per
// location), then reads back the resulting per-server latency from the Clash API proxy list - this
// tests all servers in a section with far fewer requests than testing each of them individually.
export async function getSubscriptionServersWithLatency(): Promise<IGetSubscriptionServersResponse> {
  const configSections = await getConfigSections();

  const subscriptionSections = configSections.filter(
    (section): section is Podkop.ConfigSection & { proxy_config_type: 'subscription' } =>
      section.connection_type === 'proxy' &&
      section.proxy_config_type === 'subscription',
  );

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

  const data = serversBySection.map(({ section, servers }) => {
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
  });

  return { success: true, data };
}
