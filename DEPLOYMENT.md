# Deployment on Ash

The authoritative checkout is `/home/tc/prime-tree` on Ash (Ubuntu WSL, SSH 2222). https://spiral.by.tc serves its `dist/` directory. Source, dependencies, configuration, and the published build were preserved during migration on October 10, 2026. The existing uncommitted change in `src/App.jsx` remains uncommitted and was not included in the migration commit. No application rebuild was performed.

Build/publish from this checkout on Ash with `npm run build`; use `npm ci` first when dependencies need installation. A build in the retained Phoenix copy no longer changes the public site. There is no deployment CI or application backend.

Phoenix retains public HTTPS and certificate renewal during migration and proxies this site to Ash port 18081. Its HTTP ACME webroot remains on Phoenix until the gateway handoff. The current Ash vhost is `deploy/spiral.by.tc.migration.conf`; the complete HTTPS template is `deploy/spiral.by.tc.conf`. Validate nginx before reloading. The normal Ash static-site backup includes this source (including uncommitted files) and compiled site.
