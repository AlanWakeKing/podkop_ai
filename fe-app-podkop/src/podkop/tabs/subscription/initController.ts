import { onMount, preserveScrollForPage } from '../../../helpers';
import { CustomPodkopMethods } from '../../methods';
import { logger, store, StoreType } from '../../services';
import { renderServerList } from './partials';

async function fetchSubscriptionServers() {
  store.set({
    subscriptionServersWidget: {
      ...store.get().subscriptionServersWidget,
      loading: true,
      failed: false,
    },
  });

  const { data, success } = await CustomPodkopMethods.getSubscriptionServers();

  if (!success) {
    logger.error(
      '[SUBSCRIPTION]',
      'fetchSubscriptionServers: failed to fetch',
    );
  }

  store.set({
    subscriptionServersWidget: {
      ...store.get().subscriptionServersWidget,
      loading: false,
      failed: !success,
      data,
    },
  });
}

// Only ever called from an explicit user action (the "Test latency" button) - this triggers real
// network probes on the router (one per location) that can take a while and noticeably slow the
// router down for other unrelated requests, so it must never run automatically on mount.
async function handleTestLatency() {
  store.set({
    subscriptionServersWidget: {
      ...store.get().subscriptionServersWidget,
      latencyFetching: true,
    },
  });

  const { data, success } =
    await CustomPodkopMethods.testSubscriptionServersLatency();

  if (!success) {
    logger.error('[SUBSCRIPTION]', 'handleTestLatency: failed to fetch');
  }

  store.set({
    subscriptionServersWidget: {
      loading: false,
      failed: !success,
      latencyFetching: false,
      data,
    },
  });
}

async function renderServersWidget() {
  logger.debug('[SUBSCRIPTION]', 'renderServersWidget');
  const widget = store.get().subscriptionServersWidget;
  const container = document.getElementById('subscription-servers-list');

  const renderedWidget = renderServerList({
    loading: widget.loading,
    failed: widget.failed,
    latencyFetching: widget.latencyFetching,
    sections: widget.data,
    onTestLatency: () => handleTestLatency(),
  });

  return preserveScrollForPage(() => {
    container!.replaceChildren(renderedWidget);
  });
}

async function onStoreUpdate(
  next: StoreType,
  prev: StoreType,
  diff: Partial<StoreType>,
) {
  if (diff.subscriptionServersWidget) {
    renderServersWidget();
  }
}

async function onPageMount() {
  onPageUnmount();
  store.subscribe(onStoreUpdate);
  await fetchSubscriptionServers();
}

function onPageUnmount() {
  store.unsubscribe(onStoreUpdate);
  store.reset(['subscriptionServersWidget']);
}

function registerLifecycleListeners() {
  store.subscribe((next, prev, diff) => {
    if (
      diff.tabService &&
      next.tabService.current !== prev.tabService.current
    ) {
      const isSubscriptionVisible =
        next.tabService.current === 'subscription';

      if (isSubscriptionVisible) {
        logger.debug(
          '[SUBSCRIPTION]',
          'registerLifecycleListeners',
          'onPageMount',
        );
        return onPageMount();
      }

      if (!isSubscriptionVisible) {
        logger.debug(
          '[SUBSCRIPTION]',
          'registerLifecycleListeners',
          'onPageUnmount',
        );
        return onPageUnmount();
      }
    }
  });
}

export async function initController(): Promise<void> {
  onMount('subscription-status').then(() => {
    logger.debug('[SUBSCRIPTION]', 'initController', 'onMount');
    onPageMount();
    registerLifecycleListeners();
  });
}
