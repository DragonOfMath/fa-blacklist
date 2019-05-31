# fa-blacklist-webext
WebExtension for FurAffinity that adds advanced blacklisting/whitelisting capabilities.

For instructions on installing and using the userscript version, go to [this section](#installation-userscript).


# Installation (browser add-on)
1. Download this repository as a .zip file to your desktop and unzip it.
2. Choose for your browser:
  * For Firefox, go to `about:debugging#addons` and click "Load Temporary Add-on" (yes, this is temporary).
  * For Chrome, go to `chrome://extensions`, enable Developer mode, and click "Load Unpacked".
  * For Opera, click on the Opera button and go to Extensions, click the Developer Mode button, and click "Load unpacked extension".
  * For other browsers, consult a quick google search because I'm too lazy to list them here.
3. Open the `manifest.json` file of the extension directory, or load by selecting the directory.
4. Test it out! The extension remains until you close the browser or manually remove it from the same page as you installed it.

(Ignore manifest warnings: browsers may have conflicting strictness about its properties, but the end result makes no difference on the usage)

# Installation (userscript)
1. Download the userscript from the 'raw' link (or click [here](https://raw.githubusercontent.com/DragonOfMath/fa-blacklist-webext/master/fa-blacklist.user.js)).
2. Install (not in disabled state!).
3. You're done! Go onto FA and you'll see 'FA Blacklist' text on the topbar next to search (or your name if you're using the beta theme). Click this to show the app's window interface.

### FA Blacklist 2: Electric Boogaloo
After what felt like an eternity of waiting, the **FA Blacklist** is finally back and ***better than ever***.

As you can see, it's no longer a userscript, but a *WebExtension* (note: made again into a userscript for compatibility reasons). There are many reasons this is necessary, one being that many features became obsolete in the meantime, and another that WebExtensions are standardized for nearly all popular browsers (1). That being said, there are some really *really* big changes I'd like to walk you through.

# Multiple Interfaces
* The browser action pop-up
* The filter editor
* The options page
* Modifications to FurAffinity webpages
* The master list page (add-on only)

### Browser Pop-up
The pop-up is part of the browser window, not the webpage, so it can be opened anywhere and anytime. The main purpose of the pop-up is to provide an entry point for the hidden other interfaces, such as the Editor and Options page, as well as display a clean list of your filters. All its functions include:
* You can click the **power button** in the pop-up to enable/disable the Extension (it turns grey)
* You can open the editor via **+New Filter** or by clicking the tag for any filter listed in the table
* You can open the options page via **Options...** to configure special settings for the extension
* You can search filters by name if you have lots of them
* You can organize the filters by ID, Name, Color, and Size

Each row of the filter list has a switch for enabling/disabling that filter and a delete button (with confirmation before actually removing).

### Editor
The new filter editor is a huge upgrade from the original, and as a result, it needs its own web document. Changes include:
* Friendlier look, loadout, and tab updating
* Live preview of the filter's tag as you modify its name, color, and certain options
* Dropdown for the type of filter
* Color picker for the font
* Submissions textarea (yay!)
* Switch labels replace checkboxes so they're easier to click on and look vvvv nice

With the addition of filtering submissions individually, new options have arised. Auto-filtering has been expanded so that you can specify to match submissions, match usernames, and prefer which to filter.

As importing watchlists has been made possible again, so has importing galleries and favorites, thanks to [FAExport](https://github.com/boothale/FAExport).

### Options
The options page is a quaint but useful webpage. It has undergone some changes from its predecessor, as follows:
* The **Language** selector, instantly translates the app to the language you select (only for the userscript, supports English and Russian so far).
* The **Enable** option, shared with the pop-up's "power button".
* The **Always Scan** option, which lets you control when to scan webpages for keywords. Checking this will let filters check the webpage every time you view it (whether loading or switching to the tab).
* The **Automatically Sort** option, kept from the original, causes the extension to sort the filter contents alphabetically.
* The **Cleanup** option, which is mostly a cosmetic fix for profile pages that hides the first submission and favorite.
* The **Notification** option, which enables browser notifications from the extension.
* The **Censor** option was removed to become compatible with the new interface programming. I may re-introduce this in the future.
* The **Include Username** option was moved to the filter editor and repurposed.
* A **Reset** button to return to default settings
* A **Purge Data** button, which will reset the app to its original factory state

### Page Interface
When viewing webpages on FurAffinity, you'll notice a new option in the navbar called "Blacklist" with a familar icon next to it. Click it and you will see a windowed list of all the users and submissions found on the page that you can apply tags to. The window is draggable like before, but now has a top-right button to hide it.

You can see the newest addition to the interface by hovering over any user or submission on the page for a couple seconds. The window will update and narrow its list down to only the stuff relevant to what you hovered over. Pretty neat, huh?

### Master List
As of 2.1.0, the Master List is a special page that lists all the users and submissions that are currently in filters. You have the advantage of editing tags off-site in the same fashion as on it. However, the initial loadout can be a heavy process.

*This page is not available for the userscript.*

# Notes
1. It is 100% recommended **not** to use Internet Explorer or mobile browsers, as these tend to be far behind in the WebExtension standards. Edge and Opera are also slightly behind, but are still compatible.

2. If you are using the userscript version, please disable it when using the extension, and vice versa! Having both at the same time can cause interference with each other. 

# To-Do
I keep a to-do list of objectives that aren't required for the extension to work, but do add functionality that makes life easier. You can view the TODO.txt file to see what I have planned.

# Contributing
I am in need of volunteers to help translate messages. See `_locales/en/messages.json` for the English locales that need translating. If translating isn't your thing, you're also free to help beta-test this extension for desktop and mobile.

# Feedback
Please send me your suggestions and bugs to the repo's [issue inbox](https://github.com/DragonOfMath/fa-blacklist-webext/issues/new). If you have questions about the usage of certain interfaces, I'd be happy to help. Comments and criticisms about my work are welcome, too.
