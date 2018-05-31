# Unicycle

Unicycle is an Electron application built using TypeScript, React and ant.design. Its purpose is to unify the design / development cycle.

Unicycle allows you to *create, live edit and test presentational components and export them to different frameworks* (React and Vue.js by now). Each component has three different parts:

- Markup: the markup, written in HTML with special attributes for conditional writing and loops
- Style: SCSS for the component
- Tests: JSON structure where you can define example values of the props the component accepts

![Main window](/screenshots/main.png?raw=true "Main window")

## Benefits

- A designer with knowledge of web technologies can create presentational components without having to install a full development environment.
- A frontend developer will obtain fully working code that can integrate directly into the app without having to spend hours trying to mimic a design

## Code coverage

Since Unicycle knows all the possible tests/states of a component it is able to provide you:

- Markup coverage. If an HTML element is never renderer you'll get noticed in the code editor
- SCSS coverage. If a selector is never used, you'll get noticed in the code editor
- State coverage (WIP). If a value in your test data / state is not used, you'll get noticed in the code editor

## Import from Sketch

Unicycle provides a Sketch plugin to exoport a selection and convert it to a component. The result is not perfect but the CSS and the HTML structure is optimal and semantic to be as simple as possible to fine tune.

![Import from Sketch](/screenshots/import-from-sketch.png?raw=true "Import from Sketch")

## Remote testing

Unicycle provides an internal HTTP server that you can enable so you can test your live preview in any browser, including mobile phones.

![Remote testing](/screenshots/remote-testing.png?raw=true "Remote testing")

## Style palette

Unicycle encourages to use a design system. Thus, it provides tools for creating a global stylesheet for defining colors, shadows, fonts and animations. And like everything in Unicycle, you can edit it and see the changes in real time.

![Style palette](/screenshots/style-palette.png?raw=true "Style palette")

# Installing and running

- Clone the repository
- Run `npm install`
- Run `./build-sass.sh` (required to rebuild native dependencies with electron as target and not Node.js)
- Run `npm start`

# Roadmap

- Generate React Native code. It will require to support XML as markup instead of HTML and re-think the way CSS is handled.
- Support designing email templates through [Inky](https://foundation.zurb.com/emails/docs/inky.html)
- Git integration. Right now there is initial code for that. The idea is to allow designers to contribute directly to git repositories to further improve the collaboration between designers and developers.
