"use strict";
"require baseclass";
"require form";
"require ui";
"require uci";
"require fs";
"require view.podkop.main as main";

function createWizardContent(section) {
  const o = section.option(form.DummyValue, "_mount_node");
  o.rawhtml = true;
  o.cfgvalue = () => {
    main.WizardTab.initController();
    return main.WizardTab.render();
  };
}

const EntryPoint = {
  createWizardContent,
};

return baseclass.extend(EntryPoint);
