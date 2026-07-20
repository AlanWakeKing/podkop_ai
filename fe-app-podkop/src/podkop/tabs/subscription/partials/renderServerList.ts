import { ISubscriptionSectionRows } from '../../../methods/custom/getSubscriptionServersWithLatency';
import { renderServerRow } from './renderServerRow';

interface IRenderServerListProps {
  loading: boolean;
  failed: boolean;
  sections: ISubscriptionSectionRows[];
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
  sections,
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
        E('b', { class: 'pdk_subscription-page__section__title' }, section.displayName),
        E(
          'div',
          { class: 'pdk_subscription-page__section__rows' },
          section.servers.map(renderServerRow),
        ),
      ]),
    ),
  );
}
