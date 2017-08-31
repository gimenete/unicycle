cd node_modules/node-sass/

# Build for Electron v1.6.12
ARCH="x64"
node-gyp rebuild --target=1.6.12 --arch=$ARCH --dist-url=https://atom.io/download/electron

# Create vendor directory
VENDOR="vendor/darwin-$ARCH-53"
mkdir $VENDOR
cp build/Release/binding.node $VENDOR

cd ../../

# Clean up
rm -rf build
