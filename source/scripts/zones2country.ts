import moment from "moment-timezone";

const rawZone2country = moment.tz
  .countries() //for each country
  .map((code) => moment.tz.zonesForCountry(code).map((zone) => [zone, code])) //map zone to country code
  .flat(); // flatten

const zones2countryObject = Object.fromEntries(rawZone2country);

const zones2country: { [key: string]: string } = zones2countryObject;

export default zones2country;
