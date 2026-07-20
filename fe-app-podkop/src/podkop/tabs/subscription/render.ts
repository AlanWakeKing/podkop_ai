import { renderServerList } from './partials';

export function render() {
  return E(
    'div',
    {
      id: 'subscription-status',
      class: 'pdk_subscription-page',
    },
    E(
      'div',
      { id: 'subscription-servers-list' },
      renderServerList({
        loading: true,
        failed: false,
        latencyFetching: false,
        sections: [],
        expandedLocations: new Set(),
        onTestLatency: () => {},
        onToggleLocation: () => {},
      }),
    ),
  );
}
