/**
 * Google Codelabs Interactive Behavior
 * Controls step navigation, progress tracking, drawer filtering, and copy-to-clipboard.
 */

(function () {
  'use strict';

  // DOM Elements
  const stepList = document.getElementById('step-list');
  const stepElements = document.querySelectorAll('.codelab-step');
  const TOTAL_STEPS = stepElements.length;
  let currentStep = 0;

  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const stepIndicator = document.getElementById('step-indicator');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const filterInput = document.getElementById('step-filter');
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawer-backdrop');

  /**
   * Initializes the codelab state from URL hash or localStorage.
   */
  function init() {
    let initialStep = 0;
    
    // Check URL hash (e.g. #0, #1, ..., #7)
    const hash = window.location.hash.replace('#', '');
    const parsedHash = parseInt(hash, 10);
    if (!isNaN(parsedHash) && parsedHash >= 0 && parsedHash < TOTAL_STEPS) {
      initialStep = parsedHash;
    } else {
      // Check localStorage
      try {
        const saved = localStorage.getItem('codelab_step');
        const parsedSaved = parseInt(saved, 10);
        if (!isNaN(parsedSaved) && parsedSaved >= 0 && parsedSaved < TOTAL_STEPS) {
          initialStep = parsedSaved;
        }
      } catch (e) {}
    }

    setupEventListeners();
    goToStep(initialStep, false);
  }

  /**
   * Renders the specified step.
   * @param {number} stepIndex - Index of the step (0-based).
   * @param {boolean} smoothScroll - Whether to smoothly scroll to top.
   */
  function goToStep(stepIndex, smoothScroll = true) {
    if (stepIndex < 0 || stepIndex >= TOTAL_STEPS) return;

    currentStep = stepIndex;

    // 1. Show only active step content
    stepElements.forEach((el, idx) => {
      if (idx === currentStep) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // 2. Update navigation drawer items
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach((item, idx) => {
      item.classList.remove('active', 'completed');
      if (idx === currentStep) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (idx < currentStep) {
        item.classList.add('completed');
      }
    });

    // 3. Update Progress Bar
    const progressPercent = TOTAL_STEPS > 1 ? (currentStep / (TOTAL_STEPS - 1)) * 100 : 100;
    if (progressBarFill) {
      progressBarFill.style.width = `${progressPercent}%`;
    }

    // 4. Update Footer Action Buttons
    if (prevBtn) {
      prevBtn.disabled = currentStep === 0;
    }
    if (nextBtn) {
      const labelSpan = nextBtn.querySelector('.btn-label') || nextBtn;
      if (currentStep === TOTAL_STEPS - 1) {
        labelSpan.textContent = 'Done';
      } else {
        labelSpan.textContent = 'Next';
      }
    }
    if (stepIndicator) {
      stepIndicator.textContent = `Step ${currentStep + 1} of ${TOTAL_STEPS}`;
    }

    // 5. Update URL Hash and LocalStorage
    window.location.hash = `#${currentStep}`;
    try {
      localStorage.setItem('codelab_step', currentStep.toString());
    } catch (e) {}

    // 6. Scroll main content to top
    if (smoothScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 7. Close mobile drawer if open
    closeDrawer();
  }

  /**
   * Sets up interactive event listeners.
   */
  function setupEventListeners() {
    // Drawer step clicks
    if (stepList) {
      stepList.addEventListener('click', (e) => {
        const item = e.target.closest('.step-item');
        if (item) {
          e.preventDefault();
          const stepIndex = parseInt(item.getAttribute('data-step'), 10);
          if (!isNaN(stepIndex)) {
            goToStep(stepIndex);
          }
        }
      });
    }

    // Prev / Next button clicks
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
          goToStep(currentStep - 1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentStep < TOTAL_STEPS - 1) {
          goToStep(currentStep + 1);
        } else {
          goToStep(TOTAL_STEPS - 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    // Hash change in browser (Back / Forward buttons)
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      const stepIndex = parseInt(hash, 10);
      if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < TOTAL_STEPS && stepIndex !== currentStep) {
        goToStep(stepIndex, false);
      }
    });

    // Keyboard navigation (ArrowLeft / ArrowRight)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight' && currentStep < TOTAL_STEPS - 1) {
        goToStep(currentStep + 1);
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        goToStep(currentStep - 1);
      }
    });

    // Filter input
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const items = document.querySelectorAll('.step-item');
        items.forEach((item) => {
          const label = item.querySelector('.step-label');
          const text = label ? label.textContent.toLowerCase() : '';
          if (!query || text.includes(query)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeDrawer);
    }
  }

  function toggleDrawer() {
    if (drawer) drawer.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('open');
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  /**
   * Code snippet copy button handler.
   */
  window.copyCode = function (button) {
    const codeBlock = button.closest('devsite-code');
    if (!codeBlock) return;
    const codeEl = codeBlock.querySelector('code') || codeBlock.querySelector('pre');
    if (!codeEl) return;
    
    const textToCopy = codeEl.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const icon = button.querySelector('.material-icons');
      const text = button.querySelector('.copy-text');
      const originalText = text ? text.textContent : 'Copy';
      const originalIcon = icon ? icon.textContent : 'content_copy';

      if (icon) icon.textContent = 'check';
      if (text) text.textContent = 'Copied!';
      button.classList.add('copied');

      setTimeout(() => {
        if (icon) icon.textContent = originalIcon;
        if (text) text.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
