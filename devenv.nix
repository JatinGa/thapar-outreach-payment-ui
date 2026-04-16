{ pkgs, lib, config, inputs, ... }:

{
  packages = [ pkgs.git pkgs.pnpm ];

  languages.javascript.enable = true;
  languages.typescript.enable = true;
}
