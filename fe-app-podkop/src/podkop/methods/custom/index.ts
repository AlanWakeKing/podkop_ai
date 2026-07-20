import { getConfigSections } from './getConfigSections';
import { getDashboardSections } from './getDashboardSections';
import { getClashApiSecret } from './getClashApiSecret';
import {
  getSubscriptionServers,
  testSubscriptionServersLatency,
} from './getSubscriptionServersWithLatency';

export const CustomPodkopMethods = {
  getConfigSections,
  getDashboardSections,
  getClashApiSecret,
  getSubscriptionServers,
  testSubscriptionServersLatency,
};
