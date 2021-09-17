# Usage ./release.sh major|minor|patch
Write-Host "Going to release the following version:"
npm version $args[0]
git push
git push --tags
