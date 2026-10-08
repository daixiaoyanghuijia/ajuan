/**
 * 个人主页 · 交互脚本
 *
 * 特点：
 * - 原生 JavaScript，无第三方依赖，可直接双击 HTML 离线打开
 * - 所有功能都为「渐进增强」：脚本失效时页面依然可以正常浏览
 *
 * 模块：
 * 1. 主题切换（跟随系统 / 记忆用户选择）
 * 2. 移动端导航
 * 3. 滚动时高亮当前栏目
 * 4. 内容滚动入场动画
 * 5. 返回顶部按钮
 * 6. 联系表单校验 + 唤起邮件客户端
 */
(function () {
  'use strict';

  /** 主题在 localStorage 中的键名，需与 <head> 内联脚本保持一致 */
  var THEME_KEY = 'theme';
  var root = document.documentElement;

  /* ------------------------------------------------------------------
     工具函数
     ------------------------------------------------------------------ */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call(
      (scope || document).querySelectorAll(selector)
    );
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ------------------------------------------------------------------
     1. 主题切换
     ------------------------------------------------------------------ */
  function initTheme() {
    var toggle = $('#themeToggle');
    if (!toggle) return;

    var icon = $('[data-theme-icon]', toggle);
    var meta = $('meta[name="theme-color"]');
    var media = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(theme) {
      var isDark = theme === 'dark';
      root.dataset.theme = isDark ? 'dark' : 'light';

      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.setAttribute(
        'aria-label',
        isDark ? '切换到浅色模式' : '切换到深色模式'
      );
      if (icon) icon.textContent = isDark ? '☀️' : '🌙';
      if (meta) meta.setAttribute('content', isDark ? '#0f131a' : '#f5f7fb');
    }

    function readSavedTheme() {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch (error) {
        return null; // 隐私模式下可能无法读取
      }
    }

    function saveTheme(theme) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (error) {
        /* 存储不可用时忽略即可，仅本次会话生效 */
      }
    }

    applyTheme(root.dataset.theme || (media.matches ? 'dark' : 'light'));

    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
    });

    // 用户未主动选择过主题时，跟随系统设置变化
    var onSystemChange = function (event) {
      if (readSavedTheme()) return;
      applyTheme(event.matches ? 'dark' : 'light');
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onSystemChange);
    } else if (typeof media.addListener === 'function') {
      media.addListener(onSystemChange);
    }
  }

  /* ------------------------------------------------------------------
     2. 移动端导航
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = $('#navToggle');
    var nav = $('#primaryNav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    }

    function close() {
      setOpen(false);
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    // 点击菜单项后自动收起
    $$('.nav__link', nav).forEach(function (link) {
      link.addEventListener('click', close);
    });

    // 点击页面其它位置或按 Esc 收起
    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });

    // 窗口放大到桌面端时重置状态
    window.addEventListener('resize', function () {
      if (window.innerWidth > 767) close();
    });
  }

  /* ------------------------------------------------------------------
     3. 滚动高亮当前栏目
     ------------------------------------------------------------------ */
  function initScrollSpy() {
    var links = $$('.nav__link[href^="#"]');
    if (!links.length) return;

    var header = $('.site-header');
    var entries = links
      .map(function (link) {
        var section = document.getElementById(link.hash.slice(1));
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (!entries.length) return;

    var ticking = false;

    function setActive(activeLink) {
      entries.forEach(function (entry) {
        entry.link.classList.toggle('is-active', entry.link === activeLink);
      });
    }

    function update() {
      ticking = false;

      var offset =
        (header ? header.offsetHeight : 0) + Math.min(window.innerHeight * 0.25, 140);
      var current = entries[0].link;

      entries.forEach(function (entry) {
        if (entry.section.getBoundingClientRect().top <= offset) {
          current = entry.link;
        }
      });

      // 已滚动到底部时，锁定最后一个栏目
      var atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = entries[entries.length - 1].link;

      setActive(current);
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  /* ------------------------------------------------------------------
     4. 内容滚动入场动画
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    function revealAll() {
      items.forEach(function (item) {
        item.classList.add('is-visible');
      });
    }

    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      revealAll();
      return;
    }

    // 同一组内的元素依次出现，形成轻微的错落感
    items.forEach(function (item) {
      var siblings = item.parentElement
        ? $$('[data-reveal]', item.parentElement)
        : [];
      var index = siblings.indexOf(item);
      if (index > 0) item.style.transitionDelay = index * 90 + 'ms';
    });

    var observer = new IntersectionObserver(
      function (observerEntries) {
        observerEntries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  /* ------------------------------------------------------------------
     5. 返回顶部
     ------------------------------------------------------------------ */
  function initBackToTop() {
    var button = $('#backToTop');
    if (!button) return;

    var ticking = false;

    function update() {
      ticking = false;
      button.hidden = window.scrollY < 480;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    button.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
    });

    update();
  }

  /* ------------------------------------------------------------------
     6. 联系表单
     没有后端，校验通过后唤起本机邮件客户端（收件地址写在表单的 data-email 上）。
     ------------------------------------------------------------------ */
  function initContactForm() {
    var form = $('#contactForm');
    if (!form) return;

    var status = $('#formStatus');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var rules = {
      name: function (value) {
        return value.length >= 1 || '请填写你的称呼';
      },
      email: function (value) {
        return emailPattern.test(value) || '请输入有效的邮箱地址，例如 name@example.com';
      },
      message: function (value) {
        return value.length >= 5 || '内容太短了，至少写 5 个字吧';
      }
    };

    function setFieldError(field, message) {
      var hint = $('[data-error-for="' + field.name + '"]', form);
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (!hint) return;
      hint.textContent = message;
      hint.hidden = !message;
    }

    function validateField(field) {
      var rule = rules[field.name];
      if (!rule) return true;
      var result = rule(field.value.trim());
      setFieldError(field, result === true ? '' : result);
      return result === true;
    }

    function fields() {
      return Object.keys(rules)
        .map(function (name) {
          return form.elements[name];
        })
        .filter(Boolean);
    }

    var touched = false;
    fields().forEach(function (field) {
      field.addEventListener('blur', function () {
        touched = true;
        validateField(field);
      });
      field.addEventListener('input', function () {
        if (touched && field.getAttribute('aria-invalid') === 'true') {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      touched = true;

      var allValid = fields()
        .map(validateField)
        .every(Boolean);

      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (!allValid) {
        if (status) status.textContent = '';
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var email = form.dataset.email || '';
      var subject = '来自个人主页的消息 · ' + form.elements.name.value.trim();
      var body =
        form.elements.message.value.trim() +
        '\n\n——\n' +
        form.elements.name.value.trim() +
        '（' + form.elements.email.value.trim() + '）';

      window.location.href =
        'mailto:' +
        email +
        '?subject=' +
        encodeURIComponent(subject) +
        '&body=' +
        encodeURIComponent(body);

      if (status) {
        status.textContent = '已为你打开邮件客户端，如果没有反应，可以直接发邮件到 ' + email;
      }
      form.reset();
      touched = false;
    });
  }

  /* ------------------------------------------------------------------
     7. 页脚年份 & 头部滚动态
     ------------------------------------------------------------------ */
  function initFooterYear() {
    var year = $('#currentYear');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function initHeaderState() {
    var header = $('.site-header');
    if (!header) return;

    var ticking = false;

    function update() {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  /* ------------------------------------------------------------------
     启动
     ------------------------------------------------------------------ */
  function init() {
    initTheme();
    initNav();
    initScrollSpy();
    initReveal();
    initBackToTop();
    initContactForm();
    initFooterYear();
    initHeaderState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
