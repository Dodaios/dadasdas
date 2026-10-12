/**
 * The rename from Personal Jarvis to Dodaios, October 2026: the facts the
 * notice bar, the page behind it and the 404 page all state.
 *
 * One module, because three places say the same thing and one of them is a
 * script that cannot import: the notice remembers its dismissal under a
 * storage key, and the probe in the document head has to read that key before
 * the body is painted (`RenameProbe.astro`).
 *
 * THE NOTICE IS TEMPORARY. When nobody arrives looking for the old name any
 * more, delete `RenameProbe.astro`, `RenameNotice.astro`, their two lines in
 * `Base.astro` and the two `NOTICE_*` constants below.
 * `src/pages/renamed.astro` stays for as long as old installs exist: it is
 * where they learn how to update.
 */

/** The page that explains the rename and the one manual update. */
export const RENAMED_HREF = "/renamed";

/** What the project was called. Written once so it is retired in one edit. */
export const FORMER_NAME = "Personal Jarvis";

/**
 * The last release that looks for updates at the old repository address.
 * Installs up to and including this one cannot see newer releases in the app.
 */
export const LAST_OLD_UPDATER_VERSION = "3.1.1";

/** localStorage key for "this visitor closed the notice". */
export const NOTICE_STORAGE_KEY = "dodaios:rename-notice";

/** The attribute on <html> that carries the notice's state: "on" or "off". */
export const NOTICE_ATTRIBUTE = "data-rename-notice";
