import { Podkop } from '../../../types';
import { prettyBytes } from '../../../../helpers/prettyBytes';

interface IRenderSubscriptionInfoProps {
  info: Podkop.SubscriptionInfo;
}

export function renderSubscriptionInfo({ info }: IRenderSubscriptionInfoProps) {
  const used = info.upload + info.download;
  const trafficText =
    info.total > 0
      ? `${prettyBytes(used)} / ${prettyBytes(info.total)}`
      : `${prettyBytes(used)} (${_('unlimited')})`;

  const rows = [
    info.title ? { key: _('Subscription'), value: info.title } : null,
    { key: _('Traffic used'), value: trafficText },
    info.expire > 0
      ? {
          key: _('Expires'),
          value: new Date(info.expire * 1000).toLocaleDateString(),
        }
      : null,
  ].filter((row): row is { key: string; value: string } => row !== null);

  if (rows.length === 0) {
    return E('div', {});
  }

  return E(
    'div',
    { class: 'pdk_subscription-page__info' },
    rows.map((row) =>
      E('div', { class: 'pdk_subscription-page__info__row' }, [
        E('span', { class: 'pdk_subscription-page__info__row__key' }, `${row.key}: `),
        E('span', { class: 'pdk_subscription-page__info__row__value' }, row.value),
      ]),
    ),
  );
}
