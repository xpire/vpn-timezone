// import 'emoji-log';

// browser.runtime.onInstalled.addListener((): void => {
//   console.emoji('🦄', 'extension installed');
// });

import moment from "moment-timezone";
import zones2country from "../scripts/zones2country";
import { browser, Runtime, Alarms } from "webextension-polyfill-ts";

export const MANUAL_MESSAGE_TYPE = "CUSTOM_MANUAL";
export const AUTO_MESSAGE_TYPE = "CUSTOM_AUTO";
export const SUCCESS_MESSAGE_TYPE = "SUCCESS_UPDATE";

export type storageType = {
  location?: string;
  offset?: number;
  ip?: string;
};

console.log("Hello Background");

const df = new Date().getTimezoneOffset();

export const timezone2LongName = (timezone: string) =>
  new Date()
    .toLocaleTimeString("en-US", {
      timeZone: timezone,
      timeZoneName: "long",
      hour12: false,
    })
    .slice(9);

const onCommittedHandler = ({
  tabId,
  frameId,
}: {
  tabId: number | undefined;
  frameId: number | undefined;
}) => {
  console.log("inside onCommitedHandler", { tabId, frameId });
  const store = browser.storage.local.get(["location", "offset"]);
  store.then(
    (result) => {
      const { location, offset } = result;
      console.log("inside onCommitedHandler", { result });
      const msg = timezone2LongName(location);
      const execute = browser.tabs.executeScript(tabId, {
        runAt: "document_start",
        frameId,
        matchAboutBlank: true,
        code: `document.documentElement.appendChild(Object.assign(document.createElement('script'), {
          textContent: 'Date.prefs = ["${location}", ${
          -1 * offset
        }, ${df}, "${msg}"];'
        })).remove();
        console.log(Date.prefs);
        Date.prefs;`,
      });

      console.log(
        `Date.prefs = ["${location}", ${-1 * offset}, ${df}, "${msg}"]`
      );
      execute.then(
        (res) => console.log("background.js successfully executed:", res),
        (error) => console.log("background.js execute error:", error)
      );
    },
    (error) => {
      console.log("background.js error:", error);
    }
  );
};

export const timezoneToData = (timezone: string) => {
  console.log("inside timezoneToDate", { timezone });
  const offset = moment(Date.now()).tz(timezone).utcOffset();
  // const config = offsets[timezone];
  return offset;
};

export const updateHandler = (timezone: string, ip = "N/A") => {
  // get offset and msg from timezone
  console.log("update handler is called with ", { timezone, ip });
  const offset: number = timezoneToData(timezone);
  const location = timezone;
  let localSet: storageType = {
    offset,
    location,
  };
  if (ip !== "N/A") {
    localSet = { ...localSet, ip };
  }
  const store = browser.storage.local.set(localSet);
  const countryCode = zones2country[timezone];
  console.log("flag", flag(countryCode));
  browser.browserAction.setBadgeText({ text: flag(countryCode) });
  store.then(
    (res) => {
      console.log("updateHandler success:", res);
      const sending = browser.runtime.sendMessage({
        type: SUCCESS_MESSAGE_TYPE,
      });
      sending.then(
        (success) => console.log("Finished updating in autoHandler:", success),
        (error) => console.log("autoHandler failed error:", error)
      );
    },
    (error) => console.log("updateHandler in background error:", error)
  );
};

// const char2Unicode = (char: string) =>
//   `\uD83C${String.fromCharCode(
//     parseInt("0xDDE6") + char.toLowerCase().charCodeAt(0) - 97
//   )}`;

// const flag = (countryCode: string) =>
//   countryCode &&
//   countryCode
//     .split("")
//     .map((char) => char2Unicode(char))
//     .join("");
const flag = (countryCode: string) => countryCode;

const apiEndpoints = [
  {
    url: "http://ip-api.com/json",
    key: "query",
  },
  {
    url: "http://worldtimeapi.org/api/ip",
    key: "client_ip",
  },
];

type apiType = {
  url: string;
  key: string;
};

const api = (url: string) =>
  fetch(url).then((r) => {
    console.log("api: ", { r });
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  });

const autoHandler = async (alarm: Alarms.Alarm) => {
  console.log("auto handler got alarm: ", { alarm });

  let endpoint: apiType = apiEndpoints[0];
  for (endpoint of apiEndpoints) {
    console.log("for loop: ", endpoint);
    await api(endpoint.url)
      .then((data) => {
        console.log("api success", { endpoint, data });
        return updateHandler(data.timezone, data[endpoint.key]);
      })
      .catch((err) => {
        console.log("I HIT ERROR IN FETCH:", { endpoint }, err);
      });
  }
  // // fetch("http://ip-api.com/json")
  // fetch("http://worldtimeapi.org/api/ip")
  //   .then((r) => {
  //     console.log("api: ", { r });
  //     if (!r.ok) throw new Error(r.statusText);
  //     return r.json();
  //   })
  //   .then((data) => {
  //     console.log("api data: ", { data });
  //     console.log("calling updateHandler from autoHandler", data.timezone);
  //     updateHandler(data.timezone, data.client_ip); //data.query for ip-api
  //   })
  //   .catch((err) => {
  //     console.log("I HIT ERROR IN FETCH FOR IP API: ", err);
  //   });
};

browser.webNavigation.onCommitted.addListener(onCommittedHandler, {
  url: [
    {
      schemes: ["http", "https"], //ensure it is http website
    },
  ],
});

browser.runtime.onInstalled.addListener(() => {
  console.log("oninstalled");

  console.log("calling updateHandler from runtime.onInstalled", "Etc/GMT");
  updateHandler("Etc/GMT");
});

browser.runtime.onStartup.addListener(() => {
  console.log("onstartup");

  console.log("calling updateHandler from runtime.onStartup", "Etc/GMT");
  updateHandler("Etc/GMT");
});

// browser.alarms.create({ periodInMinutes: 1 });

// browser.alarms.onAlarm.addListener(autoHandler);

// autoHandler({ name: "hello", scheduledTime: Date.now() });

export type timezoneMessage = {
  timezone: string;
  type: string;
};

browser.runtime.onMessage.addListener(
  (data: timezoneMessage, sender: Runtime.MessageSender) => {
    console.log("runtime.onMessage was called with", { data, sender });

    console.log("calling updateHandler from runtime.onMessage", data.timezone);
    if (data.type === AUTO_MESSAGE_TYPE)
      autoHandler({ name: AUTO_MESSAGE_TYPE, scheduledTime: Date.now() });
    else if (data.type === SUCCESS_MESSAGE_TYPE) {
      // do nothing, for frontend
    } else {
      const locationGetter = browser.storage.local.get("location");
      locationGetter.then(
        (res) => updateHandler(res.location),
        (error) =>
          console.log("inside onMessage, failed to grab location", error)
      );
    }
  }
);
