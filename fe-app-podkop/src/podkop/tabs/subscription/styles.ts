// language=CSS
export const styles = `
#cbi-podkop-subscription-_mount_node > div {
    width: 100%;
}

#cbi-podkop-subscription > h3 {
    display: none;
}

.pdk_subscription-page {
    width: 100%;
}

.pdk_subscription-page__sections {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
}

.pdk_subscription-page__section {
    border: 2px var(--background-color-low, lightgray) solid;
    border-radius: 4px;
    padding: 10px;
}

.pdk_subscription-page__section__title {
    display: block;
    margin-bottom: 6px;
}

.pdk_subscription-page__section__rows {
    display: flex;
    flex-direction: column;
}

.pdk_subscription-page__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 4px;
    border-bottom: 1px solid var(--background-color-low, lightgray);
}

.pdk_subscription-page__row:last-child {
    border-bottom: none;
}

.pdk_subscription-page__row__latency {
    font-variant-numeric: tabular-nums;
}

.pdk_subscription-page__row__latency--empty {
    color: var(--color-neutral, gray);
}

.pdk_subscription-page__row__latency--green {
    color: var(--success-color-medium, green);
}

.pdk_subscription-page__row__latency--yellow {
    color: var(--warning-color-medium, orange);
}

.pdk_subscription-page__row__latency--red {
    color: var(--error-color-medium, red);
}
`;
