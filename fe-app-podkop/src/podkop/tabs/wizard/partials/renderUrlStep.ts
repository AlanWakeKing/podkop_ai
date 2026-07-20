interface IRenderUrlStepProps {
  url: string;
  loading: boolean;
  error: string;
  onCheck: (url: string) => void;
}

export function renderUrlStep({
  url,
  loading,
  error,
  onCheck,
}: IRenderUrlStepProps) {
  let input: HTMLInputElement;

  return E('div', { class: 'pdk_wizard-page__step' }, [
    E('h4', {}, _('Set up your VPN')),
    E(
      'p',
      { class: 'pdk_wizard-page__hint' },
      _('Paste the subscription link your VPN provider gave you.'),
    ),
    E('div', { class: 'pdk_wizard-page__field' }, [
      (input = E('input', {
        type: 'text',
        class: 'cbi-input-text',
        placeholder: 'https://example.com/sub/...',
        value: url,
        onkeydown: (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onCheck(input.value.trim());
          }
        },
      }) as HTMLInputElement),
    ]),
    error
      ? E('div', { class: 'pdk_wizard-page__error' }, error)
      : E('div', {}),
    E(
      'div',
      { class: 'pdk_wizard-page__actions' },
      E(
        'button',
        {
          type: 'button',
          class: 'cbi-button cbi-button-action',
          disabled: loading,
          click: () => onCheck(input.value.trim()),
        },
        loading ? _('Checking…') : _('Continue'),
      ),
    ),
  ]);
}
