{ pkgs ? import (builtins.fetchTarball "https://github.com/NixOS/nixpkgs/archive/nixos-unstable.tar.gz") {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_20
    electron
    python3
    pkg-config
    gcc
    gnumake
    pixman
    cairo
    pango
    giflib
    libjpeg
    librsvg
    curl
    lsof
  ];

  shellHook = ''
    export ELECTRON_OVERRIDE_DIST_PATH="${pkgs.electron}/bin"
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [
      pkgs.xorg.libX11
      pkgs.xorg.libXcomposite
      pkgs.xorg.libXdamage
      pkgs.xorg.libXext
      pkgs.xorg.libXfixes
      pkgs.xorg.libXrandr
      pkgs.xorg.libxcb
      pkgs.mesa
      pkgs.libGL
      pkgs.libdrm
      pkgs.gtk3
      pkgs.glib
      pkgs.pango
      pkgs.cairo
      pkgs.nss
      pkgs.nspr
      pkgs.atk
      pkgs.at-spi2-atk
      pkgs.dbus
      pkgs.expat
      pkgs.cups
      pkgs.alsa-lib
    ]}:$LD_LIBRARY_PATH"
    echo "NixOS dev shell ready - Electron provided by Nix"
  '';
}
