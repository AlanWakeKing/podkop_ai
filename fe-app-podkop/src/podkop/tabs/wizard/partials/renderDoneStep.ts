export function renderDoneStep() {
  return E('div', { class: 'pdk_wizard-page__step' }, [
    E('h4', {}, _('All set!')),
    E(
      'p',
      { class: 'pdk_wizard-page__hint' },
      _(
        'Podkop is configured and starting up. Check the Subscription tab to see your servers, or Dashboard for live status.',
      ),
    ),
  ]);
}
