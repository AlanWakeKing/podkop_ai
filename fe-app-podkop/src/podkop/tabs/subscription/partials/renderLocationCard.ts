import { ISubscriptionLocationCard } from '../../../methods/custom/getSubscriptionServersWithLatency';
import { getLatencyClass } from './renderServerRow';
import { renderServerRow } from './renderServerRow';

interface IRenderLocationCardProps {
  location: ISubscriptionLocationCard;
  expanded: boolean;
  onToggle: (code: string) => void;
}

export function renderLocationCard({
  location,
  expanded,
  onToggle,
}: IRenderLocationCardProps) {
  return E(
    'div',
    {
      class: `pdk_subscription-page__card ${expanded ? 'pdk_subscription-page__card--expanded' : ''}`,
    },
    [
      E(
        'div',
        {
          class: 'pdk_subscription-page__card__header',
          click: () => onToggle(location.code),
        },
        [
          E('span', { class: 'pdk_subscription-page__card__header__arrow' }, expanded ? '▾' : '▸'),
          E('b', { class: 'pdk_subscription-page__card__header__name' }, location.displayName),
          E(
            'span',
            { class: 'pdk_subscription-page__card__header__count' },
            `${location.servers.length} ${_('servers')}`,
          ),
          E(
            'span',
            {
              class: `pdk_subscription-page__row__latency ${getLatencyClass(location.bestLatency)}`,
            },
            location.bestLatency ? `${location.bestLatency}ms` : _('N/A'),
          ),
        ],
      ),
      expanded
        ? E(
            'div',
            { class: 'pdk_subscription-page__card__body' },
            location.servers.map(renderServerRow),
          )
        : E('div', {}),
    ],
  );
}
