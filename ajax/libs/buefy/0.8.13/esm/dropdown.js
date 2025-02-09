import './chunk-17222463.js';
import { r as registerComponent, u as use } from './chunk-cca88db8.js';
import './chunk-42f463e6.js';
import { D as Dropdown, a as DropdownItem } from './chunk-044b7bcd.js';
export { D as BDropdown, a as BDropdownItem } from './chunk-044b7bcd.js';

var Plugin = {
  install: function install(Vue) {
    registerComponent(Vue, Dropdown);
    registerComponent(Vue, DropdownItem);
  }
};
use(Plugin);

export default Plugin;
