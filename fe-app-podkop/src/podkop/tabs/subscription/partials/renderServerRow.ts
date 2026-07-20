import { ISubscriptionServerRow } from '../../../methods/custom/getSubscriptionServersWithLatency';

export function getLatencyClass(latency: number) {
  if (!latency) {
    return 'pdk_subscription-page__row__latency--empty';
  }

  if (latency < 800) {
    return 'pdk_subscription-page__row__latency--green';
  }

  if (latency < 1500) {
    return 'pdk_subscription-page__row__latency--yellow';
  }

  return 'pdk_subscription-page__row__latency--red';
}

export function renderServerRow(server: ISubscriptionServerRow) {
  return E('div', { class: 'pdk_subscription-page__row' }, [
    E('span', { class: 'pdk_subscription-page__row__name' }, server.displayName),
    E(
      'span',
      { class: `pdk_subscription-page__row__latency ${getLatencyClass(server.latency)}` },
      server.latency ? `${server.latency}ms` : _('N/A'),
    ),
  ]);
}
