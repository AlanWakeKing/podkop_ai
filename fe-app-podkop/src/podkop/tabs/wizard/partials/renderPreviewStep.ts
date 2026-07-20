import { Podkop } from '../../../types';
import { prettyBytes } from '../../../../helpers/prettyBytes';

interface IRenderPreviewStepProps {
  preview: Podkop.SubscriptionPreview;
  applying: boolean;
  onConfirm: () => void;
  onEditUrl: () => void;
}

export function renderPreviewStep({
  preview,
  applying,
  onConfirm,
  onEditUrl,
}: IRenderPreviewStepProps) {
  const locations = Object.values(preview.locations || {});
  const info = preview.info;
  const used = (info?.upload || 0) + (info?.download || 0);
  const trafficText =
    info && info.total > 0
      ? `${prettyBytes(used)} / ${prettyBytes(info.total)}`
      : `${prettyBytes(used)} (${_('unlimited')})`;

  return E('div', { class: 'pdk_wizard-page__step' }, [
    E('h4', {}, _('This subscription looks good')),
    info?.title
      ? E('div', { class: 'pdk_wizard-page__preview-row' }, [
          E('span', {}, `${_('Subscription')}: `),
          E('b', {}, info.title),
        ])
      : E('div', {}),
    E('div', { class: 'pdk_wizard-page__preview-row' }, [
      E('span', {}, `${_('Traffic used')}: `),
      E('b', {}, trafficText),
    ]),
    E('div', { class: 'pdk_wizard-page__preview-row' }, [
      E('span', {}, `${_('Locations found')}: `),
      E('b', {}, String(locations.length)),
    ]),
    E(
      'div',
      { class: 'pdk_wizard-page__chips' },
      locations.map((name) =>
        E('span', { class: 'pdk_wizard-page__chip' }, name),
      ),
    ),
    E('div', { class: 'pdk_wizard-page__actions' }, [
      E(
        'button',
        {
          class: 'cbi-button',
          disabled: applying,
          click: () => onEditUrl(),
        },
        _('Change link'),
      ),
      E(
        'button',
        {
          class: 'cbi-button cbi-button-action',
          disabled: applying,
          click: () => onConfirm(),
        },
        applying ? _('Setting up…') : _('Set up and start'),
      ),
    ]),
  ]);
}
