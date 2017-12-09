// See isMonitoring in background.js
let isMonitoring = true;

const template = document.querySelector('template#reload-rule');
const enabledElement = document.querySelector('.addon-enabled');
const disabledElement = document.querySelector('.addon-disabled');


// Fetch reload rules from storage.
getListRules().then(setReloadRules);


// Fetch Addon active from background.js.
browser.runtime.sendMessage({type: 'isMonitoring?'});
browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
        case 'isMonitoring':
            isMonitoring = message.isMonitoring;
            updatePopupUI();
            break;
    }
});


// Handle clicks on enabled/disabled state.
document.querySelectorAll('.toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
        isMonitoring = !isMonitoring;
        browser.storage.local.set({isMonitoring});
        browser.runtime.sendMessage({type: 'monitoringChange', isMonitoring});
        updatePopupUI();
    });
});


// Click handler.
document.body.addEventListener('click', (event) => {

    // Delete.
    const deleteTrigger = event.target.closest('.option-delete');
    if (deleteTrigger) {
        const container = event.target.closest('.split');
        container.classList.toggle('hidden');
        container.nextElementSibling.classList.toggle('hidden');
        event.stopPropagation();
        return;
    }

    // Confirm delete.
    const confirmDeleteTrigger = event.target.closest('.option-delete-confirm');
    if (confirmDeleteTrigger) {
        const id = confirmDeleteTrigger.getAttribute('data-rule-id');
        deleteRule(id).then((rules) => {
            const container = event.target.closest('.split');
            container.parentNode.removeChild(container.previousElementSibling);
            container.parentNode.removeChild(container);
            updateNoRules(rules);
        });
        event.stopPropagation();
        return;
    }

    // Cancel Delete.
    const cancelDeleteTrigger = event.target.closest('.option-delete-cancel');
    if (cancelDeleteTrigger) {
        const container = event.target.closest('.split');
        container.previousElementSibling.classList.toggle('hidden');
        container.classList.toggle('hidden');
        event.stopPropagation();
        return;
    }

    // Popup.
    const popAttr = event.target.closest('[href]');
    if (popAttr) {
        const url = browser.extension.getURL(popAttr.getAttribute('href'));
        const openedWindow = window.open(url, 'live-reload', [
            'width=410',
            'height=700',
            `left=${event.screenX - 440}`,
            `top=${event.screenY}`,
            ].join(',')
        );
        if (openedWindow) {
            // Cancel opening as hyperlink.
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1424553
            event.preventDefault();
            event.stopPropagation();
        }
    }
});


function updatePopupUI() {
    enabledElement.classList.toggle('hidden', !isMonitoring);
    disabledElement.classList.toggle('hidden', isMonitoring);
}


function setReloadRules(rules) {
    updateNoRules(rules);
    rules.forEach((rule) => {
        const panel = template.content.querySelector('.panel-list-item.rule');
        const dataRuleEl = template.content.querySelector('[data-rule-id]');
        panel.querySelector('.text').textContent = rule.title;
        panel.setAttribute('href', `/form/form.html?rule=${rule.id}`);
        dataRuleEl.setAttribute('data-rule-id', rule.id);
        document.querySelector('#rules-list').appendChild(
            document.importNode(template.content, true)
        );
    });
}


function updateNoRules(rules) {
    const noRules = document.getElementById('no-rules');
    noRules.classList.toggle('hidden', rules.length >= 1);
}
