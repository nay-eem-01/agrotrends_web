#!/usr/bin/env bash
# Run on the VM after uploading deploy.sh and site/: bash deploy.sh <commit-run-attempt>
set -Eeuo pipefail
release_id=${1:?Supply a release ID}
[[ $release_id =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || { echo 'Invalid release ID' >&2; exit 2; }
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
[[ -s $script_dir/site/index.html ]] || { echo 'Build has no index.html' >&2; exit 2; }
web_root=${AGROTRENDS_WEB_ROOT:-/var/www}
state=${AGROTRENDS_HOME:-$HOME/agrotrends}/frontend-deploy
release="$web_root/agrotrends-releases/$release_id"
current="$web_root/agrotrends-current"
mkdir -p "$state"
exec 9>"$state/deploy.lock"
flock -w 300 9 || { echo 'Another frontend deployment is running' >&2; exit 1; }
[[ -L $current ]] || { echo 'Create the initial agrotrends-current symlink and configure Nginx first' >&2; exit 2; }
[[ ! -e $release ]] || { echo 'Release already exists; use a fresh run attempt' >&2; exit 2; }
previous=$(readlink -f "$current")
sudo -n install -d -m 755 "$release"
sudo -n cp -a "$script_dir/site/." "$release/"
sudo -n chown -R root:root "$release"
sudo -n find "$release" -type d -exec chmod 755 {} +
sudo -n find "$release" -type f -exec chmod 644 {} +
# Verify a public version marker rather than accepting a 200 from an old welcome page.
printf '%s\n' "$release_id" | sudo -n tee "$release/deployment-version.txt" > /dev/null
sudo -n chmod 644 "$release/deployment-version.txt"
switch_to() {
    sudo -n ln -sfn "$1" "$current.next"
    sudo -n mv -Tf "$current.next" "$current"
}
rollback() {
    trap - ERR INT TERM
    echo 'Deployment failed; restoring previous frontend' >&2
    switch_to "$previous" || echo 'ROLLBACK FAILED: inspect the VM immediately' >&2
    exit 1
}
trap rollback ERR INT TERM
switch_to "$release"
curl --fail --silent --show-error --max-time 20 "https://app.agrotrends.ahmednayeem.tech/deployment-version.txt?release=$release_id" | \
    grep -Fxq "$release_id"
curl --fail --silent --show-error --max-time 20 https://app.agrotrends.ahmednayeem.tech/ > /dev/null
ln -sfn "$previous" "$state/previous"
trap - ERR INT TERM
echo 'Frontend deployment healthy'
