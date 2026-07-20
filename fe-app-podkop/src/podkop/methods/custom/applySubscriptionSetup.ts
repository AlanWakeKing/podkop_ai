import { getConfigSections } from './getConfigSections';
import { PodkopShellMethods } from '../shell';

const WIZARD_SECTION_NAME = 'main';

// Writes the minimal UCI options needed for a subscription-based proxy section (reusing the existing
// "main" section if present, creating it otherwise) and restarts podkop to apply it. Everything else
// (routing lists, network interface, DNS) is left at whatever defaults/previous values the config
// already has - later wizard steps will cover those explicitly.
export async function applySubscriptionSetup(
  url: string,
): Promise<{ success: boolean }> {
  await uci.load('podkop');

  const sections = await getConfigSections();
  const existing = sections.find(
    (section) => section['.name'] === WIZARD_SECTION_NAME,
  );

  const sectionName = existing
    ? WIZARD_SECTION_NAME
    : uci.add('podkop', 'section', WIZARD_SECTION_NAME);

  uci.set('podkop', sectionName, 'connection_type', 'proxy');
  uci.set('podkop', sectionName, 'proxy_config_type', 'subscription');
  uci.set('podkop', sectionName, 'subscription_url', url);

  await uci.save();
  await uci.apply();

  const restartResponse = await PodkopShellMethods.restart();

  return { success: restartResponse.success };
}
