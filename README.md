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

![Code coverage](/screenshots/code-coverage.png?raw=true "Code coverage")

## Emulate browser capabilities

Unicycle is able to emulate media capabilities (e.g. media=print), orientation media queries,... So you can test all scenarios without leaving the app.

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

# Markup templating engine

## String interpolation

You can output values by using curly braces (`{expression}`). The content is a JavaScript expression. For example:

```html
<strong>{author.fullname}</strong>
```

## Dynamic attributes

You can dynamically set an HTML attribute by prefixing it with `:`. The value of the attribute will be evaluated as a JavaScript expression.

```html
<img :src="author.image">
```

Another, more advanced, example:

```html
<div class="card-image" :style="`background-image: url(${card.image})`">
  <img :src="card.image">
</div>
```

## Conditionals

You can implement conditional rendering by using the special `@if` attribute. Example:

```html
<p @if="author === null">
  Renders the paragraph element if author is null
</p>
```

## Loops

```html
<div @loop="messages" @as="message">
  <div>{message.text}</div>
</div>
```

## Including other components

For including a component into another component use `<include:ComponentName ...>...</include:ComponentName>`


# Roadmap

- Generate React Native code. It will require to support XML as markup instead of HTML and re-think the way CSS is handled.
- Support designing email templates through [Inky](https://foundation.zurb.com/emails/docs/inky.html)
- Git integration. Right now there is initial code for that. The idea is to allow designers to contribute directly to git repositories to further improve the collaboration between designers and developers.

# Status of the project

This app is a mature experiment. It mostly works, but many options are not implemented yet (e.g. all the exporting options, support for React Native and support for email templates) or are basically a proof of concept (git integration). Also a few things could change in a backwards incompatible way in the near future, so don't.
