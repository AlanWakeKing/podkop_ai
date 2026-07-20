import { ISubscriptionSectionData } from '../../../methods/custom/getSubscriptionServersWithLatency';
import { renderLocationCard } from './renderLocationCard';
import { renderSubscriptionInfo } from './renderSubscriptionInfo';

interface IRenderServerListProps {
  loading: boolean;
  failed: boolean;
  latencyFetching: boolean;
  sections: ISubscriptionSectionData[];
  expandedLocations: Set<string>;
  onTestLatency: () => void;
  onToggleLocation: (code: string) => void;
}

function renderLoadingState() {
  return E('div', {
    class: 'pdk_subscription-page__section skeleton',
    style: 'height: 200px',
  });
}

function renderFailedState() {
  return E(
    'div',
    { class: 'pdk_subscription-page__section centered', style: 'height: 200px' },
    _('Currently unavailable'),
  );
}

function renderEmptyState() {
  return E(
    'div',
    { class: 'pdk_subscription-page__section centered', style: 'height: 200px' },
    _('No subscription-based sections configured'),
  );
}

export function renderServerList({
  loading,
  failed,
  latencyFetching,
  sections,
  expandedLocations,
  onTestLatency,
  onToggleLocation,
}: IRenderServerListProps) {
  if (loading) {
    return renderLoadingState();
  }

  if (failed) {
    return renderFailedState();
  }

  if (sections.length === 0) {
    return renderEmptyState();
  }

  return E(
    'div',
    { class: 'pdk_subscription-page__sections' },
    sections.map((section) =>
      E('div', { class: 'pdk_subscription-page__section' }, [
        E('div', { class: 'pdk_subscription-page__section__header' }, [
          E('b', { class: 'pdk_subscription-page__section__title' }, section.displayName),
          E(
            'button',
            {
              type: 'button',
              class: 'cbi-button cbi-button-action',
              disabled: latencyFetching,
              click: () => onTestLatency(),
            },
            latencyFetching ? _('Testing…') : _('Test latency'),
          ),
        ]),
        renderSubscriptionInfo({ info: section.info }),
        E(
          'div',
          { class: 'pdk_subscription-page__cards' },
          section.locations.map((location) =>
            renderLocationCard({
              location,
              expanded: expandedLocations.has(location.code),
              onToggle: onToggleLocation,
            }),
          ),
        ),
      ]),
    ),
  );
}
