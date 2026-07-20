export function render() {
  return E(
    'div',
    {
      id: 'wizard-status',
      class: 'pdk_wizard-page',
    },
    E('div', { id: 'wizard-content' }),
  );
}
