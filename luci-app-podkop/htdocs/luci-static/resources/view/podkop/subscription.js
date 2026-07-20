"use strict";
"require baseclass";
"require form";
"require ui";
"require uci";
"require fs";
"require view.podkop.main as main";

function createSubscriptionContent(section) {
  const o = section.option(form.DummyValue, "_mount_node");
  o.rawhtml = true;
  o.cfgvalue = () => {
    main.SubscriptionTab.initController();
    return main.SubscriptionTab.render();
  };
}

const EntryPoint = {
  createSubscriptionContent,
};

return baseclass.extend(EntryPoint);
