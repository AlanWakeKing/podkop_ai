// language=CSS
export const styles = `
#cbi-podkop-wizard-_mount_node > div {
    width: 100%;
}

#cbi-podkop-wizard > h3 {
    display: none;
}

.pdk_wizard-page {
    width: 100%;
    max-width: 480px;
}

.pdk_wizard-page__step h4 {
    margin: 10px 0 4px;
}

.pdk_wizard-page__hint {
    color: var(--color-neutral, gray);
    margin-bottom: 14px;
}

.pdk_wizard-page__field {
    margin-bottom: 10px;
}

.pdk_wizard-page__field .cbi-input-text {
    width: 100%;
    box-sizing: border-box;
}

.pdk_wizard-page__error {
    color: var(--error-color-medium, red);
    margin-bottom: 10px;
}

.pdk_wizard-page__actions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
}

.pdk_wizard-page__preview-row {
    padding: 3px 0;
}

.pdk_wizard-page__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0;
}

.pdk_wizard-page__chip {
    border: 1px solid var(--background-color-low, lightgray);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 0.9em;
}
`;
