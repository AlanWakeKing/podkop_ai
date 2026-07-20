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
    gap: 16px;
    margin-top: 10px;
}

.pdk_subscription-page__section {
    border: 2px var(--background-color-low, lightgray) solid;
    border-radius: 4px;
    padding: 10px;
}

.pdk_subscription-page__section__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.pdk_subscription-page__section__title {
    display: block;
}

.pdk_subscription-page__info {
    margin-bottom: 10px;
}

.pdk_subscription-page__info__row {
    padding: 2px 0;
}

.pdk_subscription-page__cards {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.pdk_subscription-page__card {
    border: 1px solid var(--background-color-low, lightgray);
    border-radius: 4px;
}

.pdk_subscription-page__card__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    cursor: pointer;
}

.pdk_subscription-page__card__header__arrow {
    width: 12px;
    color: var(--color-neutral, gray);
}

.pdk_subscription-page__card__header__name {
    flex-grow: 1;
}

.pdk_subscription-page__card__header__count {
    color: var(--color-neutral, gray);
    font-size: 0.9em;
}

.pdk_subscription-page__card--expanded .pdk_subscription-page__card__header {
    border-bottom: 1px solid var(--background-color-low, lightgray);
}

.pdk_subscription-page__card__body {
    padding: 4px 10px;
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
