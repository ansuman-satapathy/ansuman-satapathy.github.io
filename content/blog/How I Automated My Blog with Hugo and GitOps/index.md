---
title: "How I Automated My Blog with Hugo and GitOps"
date: 2026-01-01T15:42:59+05:30
draft: false
toc: false
categories: ["DevOps"]
tags: ["automation", "hugo", "yaml", "gitops"]
---

This is the first blog of the site. So, I thought why not write about how I automated the infrastructure behind it so that I can put my focus on writing and also other important things in life like... _(starts overthinking)_

I really like Linux and automation and surprisingly I like to write too (which came as a late realization). I tried some blogging platforms like Hashnode and Dev.to. While the features they offer are really nice, I wanted something cleaner and distraction-free. Most importantly, I wanted to **own** what I write and have the power to change anything, anytime. And with great power, comes great memes.

<img src="parkour.gif" alt="Parkour!" style="width: 100%; height: auto; border-radius: 8px;">

I am not trying to be a "writer" or anything. I just want to document stuff so that when I am old and wise (hopefully), I can look back at this and say "What was I thinking?"

Okay, enough with the jokes. Since we are talking about static sites, I started looking for popular options out there. I had heard about Jekyll, but it's quite old now. So I went down the rabbit hole and discovered **Hugo**. Guess which language it's built on? **Go**. You see what they did there? So, I decided to go with that, of course. It is so cool! It's highly customizable, has great theme support, lets you write content in Markdown (hell yeah!), and has an awesome community.

Okay now that you have a better idea about what we are talking about. Let's get our blog set up shall we?

## 1. Install Hugo on your system

Remember to install the **Extended** version of Hugo. If you don't, your theme will likely break because standard Hugo can't process SCSS.

Follow the official guide to correctly install it based on your operating system: [https://gohugo.io/installation/linux/](https://gohugo.io/installation/)

## 2. Themes

Hugo has a great collection of official and community themes. You can look through [themes.gohugo.io](https://themes.gohugo.io/) and pick your favourite. After you have decided what theme to use, follow the below commands.

We will use **Git Submodules**. It treats the theme as a dependency, pointing to a specific commit which helps us easily install new themes or update current ones without messing up our own files.

```bash
# Create new hugo site
hugo new site my-blog --format yaml
cd my-blog
git init

# Here we add the theme as a git submodule.
# For example, I am using the "hello-friend-ng" theme:
git submodule add https://github.com/rhazdon/hugo-theme-hello-friend-ng.git themes/hello-friend-ng
```

Now, if I ever want to update the theme, it’s just `git submodule update --remote`. Clean.

## 3. Configuration

For customizing your Hugo site, go ahead and create a `hugo.yaml` (or `.toml`) file in the root of your project.

Two main things to remember here to avoid headaches:

1. **Base URL:** If you host on GitHub Pages, this must match your repo name. If your repo is `username.github.io`, it's just the root. If it's `my-blog`, you need that suffix.
2. **Unsafe Rendering:** Sometimes Markdown isn't enough (like when you want to center a div). By default, Hugo strips HTML. We need to tell it to chill out.

You can copy-paste my configuration if you are also using the `hello-friend-ng` theme.

**My `hugo.yaml`:**

```yaml
baseURL: "https://ansuman-satapathy.github.io/" # Change this to YOUR url
languageCode: "en-us"
title: "Ansuman Satapathy"
theme: "hello-friend-ng"

taxonomies:
  category: "categories"
  tag: "tags"
  series: "series"

params:
  dateform: "Jan 2, 2006"
  dateformShort: "Jan 2"
  defaultTheme: "dark"
  enableThemeToggle: true
  showReadTime: true
  mainSections:
    - "blog"
  homeSubtitle: "Backend Engineer | Go · DevOps · Linux"
  logo:
    logoText: "ansuman"
    logoHomeLink: "/"
    logoCursorColor: "#932ec9"
    logoCursorAnimate: "2s"
  social:
    - name: "github"
      url: "https://github.com/ansuman-satapathy"
    - name: "linkedin"
      url: "https://linkedin.com/in/ansuman-satapathy"

markup:
  goldmark:
    renderer:
      unsafe: true # Allows raw HTML in markdown
```

Sweet. Now go to your terminal and run `hugo server -D`. Click the link it generates, and behold: an awesome, clean site. Congrats! You can now send `http://localhost:1313/` to your friends to show off. (I'm kidding. Please don't be that person.)

## 4. Automated Build and Deployment Pipeline

This is the cool part. Now that you have your site running locally, time to deploy it to GitHub Pages. Since we are using GitHub, we will leverage **GitHub Actions** to write a custom pipeline that will build our site and deploy it.

All we need to do is `git push`. The pipeline will take care of everything else. Cool right?

Before we get started, go to your GitHub repo settings and make sure of these two things:

1. **Permissions:** By default, the Action token can’t write to your site. Go to **Settings > Actions > General** and flip "Workflow permissions" to **Read and write permissions**.
2. **Source:** Go to **Settings > Pages > Build and deployment** and set the Source to **GitHub Actions**.

In your project root, create this file structure: `.github/workflows/deploy.yaml` and put the code below in it.

**`deploy.yaml:`**

```yaml
name: Deploy to Pages
on:
  push:
    branches: ["main"]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: "latest"
          extended: true
      - name: Build
        run: hugo --minify
      - name: Upload
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - name: Deploy
        uses: actions/deploy-pages@v4
```

Create a `.gitignore` file so you don't commit unnecessary things:

```bash
public/
resources/_gen/
.hugo_build.lock
.DS_Store
.vscode/
.idea/

```

## 5. Tips

One last tip: Stop putting images in a global `static` folder.

I use **Page Bundles**. When I create a post, I make a folder: `content/blog/my-new-post/`. I put `index.md` inside it, and I drop my screenshots right there next to the text. Hugo figures it out, and I don't have to hunt for assets later.

For example, instead of this mess:

```text
content/
  posts/
    my-post.md
static/
  images/
    screenshot1.png

```

You get this clean structure:

```text
content/
  blog/
    my-new-post/
      index.md
      screenshot1.png

```

To generate this automatically, just run:

```bash
hugo new blog/my-first-blog/index.md

```

## Final Thoughts

I don't know about you, but I find this really cool. And now with AI, you can do stuff like this really fast if you wanted to. Even if you don't write anything, it is just really cool to have something like this. From code to production through a pipeline. Always magical when you see it happen.

Now that you know how CI/CD works, time to go and deploy a multi-cluster microservice with Kubernetes on AWS. (I'm joking... mostly).
