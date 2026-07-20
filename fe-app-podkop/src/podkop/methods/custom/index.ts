import { getConfigSections } from './getConfigSections';
import { getDashboardSections } from './getDashboardSections';
import { getClashApiSecret } from './getClashApiSecret';
import {
  getSubscriptionServers,
  testSubscriptionServersLatency,
} from './getSubscriptionServersWithLatency';
import { applySubscriptionSetup } from './applySubscriptionSetup';

export const CustomPodkopMethods = {
  getConfigSections,
  getDashboardSections,
  getClashApiSecret,
  getSubscriptionServers,
  testSubscriptionServersLatency,
  applySubscriptionSetup,
};
