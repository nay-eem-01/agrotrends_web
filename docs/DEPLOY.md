# Frontend staging deployment

The live frontend is `https://app.agrotrends.ahmednayeem.tech`, served by host Nginx on the Lightsail VM.
Builds run on GitHub with Node 24, not the 2 GB VM. No backend secrets are sent to frontend builds.

## Branches and activation

Nayeem's 2026-11-17 decision: **`staging` is the live deploy branch for both repos**.
Keep feature step → feature base → `development` → `staging` promotion PRs. Do not deploy from `main` or
`production`. Protect `staging` with reviewed PRs and the `checks` job. A successful merge triggers a deployment;
failed checks leave the live version unchanged. `workflow_dispatch` supports a manual run **with staging selected**.
A manual run from any other branch runs checks but cannot deploy. No additional required environment approval is
needed if the intention is deployment immediately after a merge.

Create a GitHub **Environment named `staging`** in each repo under Settings → Environments. Restrict its deployment
branches to `staging`. Configure these values separately in both repos:

| Kind | Name | Value |
|---|---|---|
| Variable | `DEPLOY_HOST` | `52.65.208.166` |
| Variable | `DEPLOY_USER` | `ubuntu` |
| Variable | `DEPLOY_KNOWN_HOSTS` | Full verified ED25519 known_hosts line for this IP, not just the fingerprint |
| Secret | `DEPLOY_SSH_KEY` | A dedicated Actions SSH private key; never the personal Lightsail key |

Generate a dedicated Ed25519 key on your own PC, with a unique filename and no passphrase for unattended Actions.
Enter the private part only in GitHub's secret editor, never in chat or Git. Add the public `.pub` line to the VM's
`~/.ssh/authorized_keys` with the `restrict` prefix (disables forwarding and PTY, while allowing deployment commands).
Keep the personal key so you can still log in interactively.

Verify the VM's key through an already trusted session:

```bash
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Expected fingerprint from the initial setup:
`SHA256:CVe4PtACewz/yDSAWPSee6G4eyBoUykiQ34Kg0TvtuU`.
On your PC, `ssh-keyscan -t ed25519 52.65.208.166` obtains the public line. Save to a temporary file and run
`ssh-keygen -lf <file>`; only copy it to `DEPLOY_KNOWN_HOSTS` if its fingerprint matches the trusted VM output.
The workflow enforces host-key checking, never accepting an arbitrary key on first use.

The deployment key logs in as `ubuntu`, which has passwordless sudo and therefore broad server access. It is
separate from the personal key, but is **not** a least-privilege deployment user. Limit who can edit staging,
workflow files, and environment secrets. The VM needs outbound HTTPS and SSH 22 reachable by the GitHub-hosted
runner; the current Lightsail SSH rule permits this. Do not install a self-hosted runner on this small live VM.

Backend and frontend workflows run independently. For incompatible API changes, deploy a backward-compatible
backend first, then the frontend. Their locks prevent overlapping releases within each service. GitHub may coalesce
pending runs; the intention is convergence on the latest staging version, not deploying every intermediate commit.

## Public build variables

Add these **variables** in the frontend repo's GitHub `staging` Environment:

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://api.agrotrends.ahmednayeem.tech` |
| `VITE_SHARE_BASE_URL` | `https://api.agrotrends.ahmednayeem.tech` |
| `VITE_GOOGLE_CLIENT_ID` | The same Google web client ID configured on the backend |

Actions writes a frontend `.env` from these variables **before building**. All three are required, preventing a
silent release without the Google button. Vite exposes these values publicly in JavaScript; never add passwords,
Google client secrets, JWT secrets or R2 credentials. `.env` stays git-ignored. Local builds can use `.env.example`
as a template. Updating `.env` after a build does not change already compiled browser code.
In Google Cloud, authorize `https://app.agrotrends.ahmednayeem.tech` as a JavaScript origin.

## One-time server setup

See the backend `docs/DEPLOY.md`: create `/var/www/agrotrends-current` pointing to today's `/var/www/agrotrends`
folder, and set the app server block's Nginx root to `/var/www/agrotrends-current`. Keep certificate settings and
SPA fallback; disable caching for `/deployment-version.txt`. Test and reload Nginx before enabling Actions.
Do not change the API server block when configuring the frontend.

## Release behavior

PRs run npm ci, lint, Vitest, build and deploy-script regression checks. Staging merges deploy only after checks pass.
The deployment build uses the public staging variables, uploads a tarball containing only the static build and
script, and publishes `/var/www/agrotrends-releases/<commit>-<run>-<attempt>`. Nginx's active symlink switches
atomically, without a reload. A public release marker and home-page probe must pass; otherwise the previous
symlink is restored and the workflow fails. A wrong/missing marker fails rather than accepting an old welcome page.

The latest previous target is saved in `~/agrotrends/frontend-deploy/previous`. To roll back from a trusted VM shell:

```bash
previous=$(readlink -f ~/agrotrends/frontend-deploy/previous)
sudo ln -sfn "$previous" /var/www/agrotrends-current.next
sudo mv -Tf /var/www/agrotrends-current.next /var/www/agrotrends-current
```

Do not delete the current/previous targets. Old releases and uploads accumulate; cleanup is manual for now.
Open tabs from an older build may need a refresh if they request a lazy-loaded asset after a release. Verify login,
refresh persistence, Google, image cleanup and reset mail manually; a static home-page probe does not prove these.
