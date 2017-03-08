# Change Log for Dynamic Points

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/) and [Keep a CHANGELOG](http://keepachangelog.com/).

## [Unreleased]

Not documented yet.

## [1.0.0] - 2017-03-00

### Added

- Hook extension to filter the points awarded by the Points reactor.
 - Number of points awarded is based on the value of an entity attribute whose value is an integer or decimal number.
 - The value may be multiplied by a number supplied by the user.
 - The rounding method may be chosen by the user when using a decimal number attribute or multiplying by a decimal value.
  - Includes a Rounding Method API with interface and base class, as well as three rounding methods: Nearest, Up, and Down.
 - A minimum and maximum number of points to award can also be set.
 - Information about how the points are calculated is shown in the How To Get Points shortcode.
 - On uninstall, any reactions still using the extension are disabled.

[unreleased]: https://github.com/WordPoints/wordpoints/compare/master...HEAD
[1.0.0]: https://github.com/WordPoints/wordpoints/compare/...1.0.0
