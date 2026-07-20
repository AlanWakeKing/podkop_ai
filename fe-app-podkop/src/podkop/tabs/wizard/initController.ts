import { onMount } from '../../../helpers';
import { CustomPodkopMethods, PodkopShellMethods } from '../../methods';
import { logger, store, StoreType } from '../../services';
import { renderUrlStep, renderPreviewStep, renderDoneStep } from './partials';

async function handleCheckUrl(url: string) {
  if (!url) {
    store.set({
      wizardWidget: {
        ...store.get().wizardWidget,
        error: _('Please paste a subscription link first'),
      },
    });
    return;
  }

  store.set({
    wizardWidget: {
      ...store.get().wizardWidget,
      url,
      loading: true,
      error: '',
    },
  });

  const response = await PodkopShellMethods.getSubscriptionPreview(url);
  const preview = response.success ? response.data : null;

  if (!preview || !preview.success) {
    logger.error('[WIZARD]', 'handleCheckUrl: preview failed', preview);
    store.set({
      wizardWidget: {
        ...store.get().wizardWidget,
        loading: false,
        error: _(
          'Could not read this subscription link. Double-check it and try again.',
        ),
      },
    });
    return;
  }

  store.set({
    wizardWidget: {
      ...store.get().wizardWidget,
      step: 'preview',
      loading: false,
      error: '',
      preview,
    },
  });
}

function handleEditUrl() {
  store.set({
    wizardWidget: {
      ...store.get().wizardWidget,
      step: 'input',
      error: '',
      preview: null,
    },
  });
}

async function handleConfirm() {
  const { url } = store.get().wizardWidget;

  store.set({
    wizardWidget: {
      ...store.get().wizardWidget,
      applying: true,
    },
  });

  const { success } = await CustomPodkopMethods.applySubscriptionSetup(url);

  if (!success) {
    logger.error('[WIZARD]', 'handleConfirm: apply failed');
    store.set({
      wizardWidget: {
        ...store.get().wizardWidget,
        applying: false,
        error: _('Something went wrong while starting podkop.'),
      },
    });
    return;
  }

  store.set({
    wizardWidget: {
      ...store.get().wizardWidget,
      step: 'done',
      applying: false,
    },
  });
}

async function renderWizardWidget() {
  logger.debug('[WIZARD]', 'renderWizardWidget');
  const widget = store.get().wizardWidget;
  const container = document.getElementById('wizard-content');

  let rendered: HTMLElement;

  if (widget.step === 'preview' && widget.preview) {
    rendered = renderPreviewStep({
      preview: widget.preview,
      applying: widget.applying,
      onConfirm: () => handleConfirm(),
      onEditUrl: () => handleEditUrl(),
    });
  } else if (widget.step === 'done') {
    rendered = renderDoneStep();
  } else {
    rendered = renderUrlStep({
      url: widget.url,
      loading: widget.loading,
      error: widget.error,
      onCheck: (url) => handleCheckUrl(url),
    });
  }

  container!.replaceChildren(rendered);
}

async function onStoreUpdate(
  next: StoreType,
  prev: StoreType,
  diff: Partial<StoreType>,
) {
  if (diff.wizardWidget) {
    renderWizardWidget();
  }
}

async function onPageMount() {
  onPageUnmount();
  store.subscribe(onStoreUpdate);
  renderWizardWidget();
}

function onPageUnmount() {
  store.unsubscribe(onStoreUpdate);
  store.reset(['wizardWidget']);
}

function registerLifecycleListeners() {
  store.subscribe((next, prev, diff) => {
    if (
      diff.tabService &&
      next.tabService.current !== prev.tabService.current
    ) {
      const isWizardVisible = next.tabService.current === 'wizard';

      if (isWizardVisible) {
        logger.debug('[WIZARD]', 'registerLifecycleListeners', 'onPageMount');
        return onPageMount();
      }

      if (!isWizardVisible) {
        logger.debug(
          '[WIZARD]',
          'registerLifecycleListeners',
          'onPageUnmount',
        );
        return onPageUnmount();
      }
    }
  });
}

export async function initController(): Promise<void> {
  onMount('wizard-status').then(() => {
    logger.debug('[WIZARD]', 'initController', 'onMount');
    onPageMount();
    registerLifecycleListeners();
  });
}
