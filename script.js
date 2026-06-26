/* ═══════════════════════════════════════════════════════════════════════════
   FODMAP HELPER — JavaScript
   Handles dynamic content, interactions, and animations
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────

const recipes = [
  {
    day: 'Monday',
    name: 'Grilled Chicken with Rice & Roasted Carrots',
    prepTime: '20',
    cookTime: '25',
    servings: '2',
    ingredients: ['Chicken breast', 'White rice', 'Carrots', 'Olive oil', 'Fresh thyme']
  },
  {
    day: 'Tuesday',
    name: 'Pan-Seared Salmon with Green Beans',
    prepTime: '10',
    cookTime: '15',
    servings: '2',
    ingredients: ['Salmon fillet', 'Green beans', 'Baby potatoes', 'Lemon', 'Butter']
  },
  {
    day: 'Wednesday',
    name: 'Gluten-Free Pasta Primavera',
    prepTime: '15',
    cookTime: '15',
    servings: '2',
    ingredients: ['GF pasta', 'Zucchini', 'Bell peppers', 'Tomatoes', 'Olive oil']
  },
  {
    day: 'Thursday',
    name: 'Scrambled Eggs with Spinach & Toast',
    prepTime: '5',
    cookTime: '10',
    servings: '1',
    ingredients: ['Eggs', 'Spinach', 'Gluten-free bread', 'Butter', 'Salt & pepper']
  },
  {
    day: 'Friday',
    name: 'Turkey Meatballs with Sweet Potato',
    prepTime: '20',
    cookTime: '25',
    servings: '3',
    ingredients: ['Ground turkey', 'GF breadcrumbs', 'Egg', 'Sweet potato', 'Carrot']
  },
  {
    day: 'Saturday',
    name: 'Roast Pork Tenderloin with Root Vegetables',
    prepTime: '15',
    cookTime: '35',
    servings: '4',
    ingredients: ['Pork tenderloin', 'Potatoes', 'Carrots', 'Green beans', 'Rosemary']
  },
  {
    day: 'Sunday',
    name: 'Tofu Stir-Fry with Rice',
    prepTime: '15',
    cookTime: '20',
    servings: '2',
    ingredients: ['Firm tofu', 'Jasmine rice', 'Bell peppers', 'Zucchini', 'Soy sauce']
    }
];

const tips = [
  { title: 'Eat Smaller Meals', description: 'Large meals can trigger symptoms. Eat 4-6 smaller meals throughout the day instead.' },
  { title: 'Stay Hydrated', description: 'Drink plenty of water to help with digestion and prevent constipation.' },
  { title: 'Keep a Food Diary', description: 'Track what you eat and when symptoms occur to identify your personal triggers.' },
  { title: 'Use Garlic-Infused Oil', description: 'Get the flavour of garlic without the FODMAPs by using garlic-infused oil.' },
  { title: 'Eat Mindfully & Slowly', description: 'Chew thoroughly and eat slowly to aid digestion and reduce bloating.' },
  { title: 'Exercise Regularly', description: 'Moderate physical activity supports digestive health and reduces symptoms.' },
  { title: 'Manage Stress', description: 'Stress can trigger digestive issues. Try yoga, meditation, or deep breathing.' },
  { title: 'Work with a Dietitian', description: 'A FODMAP dietitian can guide you through the elimination and reintroduction phases.' },
  { title: 'Read Food Labels', description: 'Check for hidden sources of FODMAPs like high fructose corn syrup and additives.' },
  { title: 'Limit Processed Foods', description: 'Fresh, whole foods are generally better tolerated than processed options.' }
];

const faqItems = [
  {
    question: 'What does FODMAP stand for?',
    answer: 'FODMAP stands for Fermentable Oligosaccharides, Disaccharides, Monosaccharides, and Polyols. These are short-chain carbohydrates that are poorly absorbed in the small intestine and can trigger digestive symptoms in sensitive individuals.'
  },
  {
    question: 'How long does the elimination phase last?',
    answer: 'The elimination phase typically lasts 2-6 weeks. Most people experience significant symptom relief within 1-2 weeks of removing high FODMAP foods from their diet.'
  },
  {
    question: 'Is the low FODMAP diet a permanent diet?',
    answer: 'No, the low FODMAP diet is not meant to be permanent. It\'s a temporary elimination diet designed to identify your personal food triggers. After reintroduction, you can expand your diet to include foods you tolerate.'
  },
  {
    question: 'Can I eat fruits on a low FODMAP diet?',
    answer: 'Yes, you can eat certain fruits. Safe options include bananas (unripe), blueberries, strawberries, grapes, kiwis, oranges, and pineapple. Avoid apples, pears, mangoes, and avocados during elimination.'
  },
  {
    question: 'Are all vegetables safe on low FODMAP?',
    answer: 'Not all vegetables are safe. Safe vegetables include carrots, spinach, lettuce, cucumber, potatoes, zucchini, and bell peppers. Avoid high FODMAP vegetables like garlic, onions, mushrooms, and asparagus during elimination.'
  },
  {
    question: 'Can I have dairy products?',
    answer: 'Some dairy is low FODMAP, while other dairy is high FODMAP. Lactose-free milk, hard cheeses like cheddar and parmesan, and butter are safe. Regular milk, yogurt, and soft cheeses should be avoided during elimination.'
  },
  {
    question: 'What can I eat for breakfast?',
    answer: 'Good breakfast options include eggs with toast, oatmeal with suitable toppings, rice cakes with peanut butter, gluten-free pancakes, or a smoothie made with low FODMAP fruits and lactose-free milk.'
  },
  {
    question: 'How do I get enough fibre on this diet?',
    answer: 'Focus on low FODMAP high-fibre foods like potatoes with skin, carrots, spinach, rice, oats, and gluten-free grains. If you need more fibre, ask your dietitian about supplements that are low FODMAP.'
  },
  {
    question: 'Can I still eat bread?',
    answer: 'Yes, but you need to choose carefully. Wheat bread is high FODMAP. Safe options include gluten-free bread and sourdough spelt bread (limit to 2 slices). Rice cakes are also a good alternative.'
  },
  {
    question: 'What about garlic and onions?',
    answer: 'Both garlic and onions are major sources of FODMAPs and should be eliminated. However, you can use garlic-infused oil for flavour, as the FODMAPs don\'t transfer to the oil.'
  },
  {
    question: 'How do I know which foods triggered my symptoms?',
    answer: 'Keep a detailed food and symptom diary. Record what you eat, the time, and any symptoms that occur. Look for patterns after a few weeks. During reintroduction, test one food group at a time.'
  },
  {
    question: 'Can I eat out at restaurants?',
    answer: 'Yes, you can eat out! Ask for modifications: no garlic or onions, plain proteins without heavy sauces, steamed vegetables instead of fried. Many restaurants are accommodating to dietary needs.'
  },
  {
    question: 'What should I do if I accidentally eat high FODMAP food?',
    answer: 'Don\'t panic. One high FODMAP meal won\'t ruin your progress. Note it in your diary, see if you have symptoms, and continue with your plan. Some people tolerate small amounts better than others.'
  },
  {
    question: 'How long does the reintroduction phase take?',
    answer: 'The reintroduction phase typically takes 8-12 weeks. You test one FODMAP group at a time, allowing 3 days between tests to observe reactions. This takes patience but provides valuable insights.'
  },
  {
    question: 'Do I need a dietitian to do this diet?',
    answer: 'While it\'s possible to do this alone, working with a registered dietitian experienced in the low FODMAP diet is strongly recommended. They ensure you\'re following it correctly and maintaining nutritional balance.'
  },
  {
    question: 'Is low FODMAP the same as gluten-free?',
    answer: 'No, they\'re different. Low FODMAP focuses on carbohydrates that cause digestive issues. Gluten-free avoids gluten protein. Some high FODMAP foods contain gluten, but not all gluten-containing foods are high FODMAP.'
  },
  {
    question: 'What are the nutritional concerns with this diet?',
    answer: 'The main concerns are adequate fibre, calcium (especially if avoiding dairy), and ensuring variety. Work with a dietitian to ensure you\'re getting all necessary nutrients during elimination and reintroduction.'
  },
  {
    question: 'Can children follow a low FODMAP diet?',
    answer: 'Children can follow this diet, but it requires careful planning to ensure adequate nutrition for growth and development. Always work with a paediatrician and dietitian if considering this for children.'
  }
];

// ─────────────────────────────────────────────────────────────────────────
// DOM MANIPULATION & INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  renderRecipes();
  renderTips();
  renderFAQ();
  setupNavigation();
  setupScrollAnimations();
});

function renderRecipes() {
  const recipeGrid = document.getElementById('recipeGrid');
  recipeGrid.innerHTML = recipes.map(recipe => `
    <div class="recipe-card">
      <div class="recipe-day">${recipe.day}</div>
      <div class="recipe-name">${recipe.name}</div>
      <div class="recipe-info">
        <span>⏱️ ${recipe.prepTime}min prep</span>
        <span>🔥 ${recipe.cookTime}min cook</span>
        <span>🍽️ Serves ${recipe.servings}</span>
      </div>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
        <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 12px; font-weight: 600;">Ingredients:</div>
        ${recipe.ingredients.map(ing => `<div class="recipe-ingredient">${ing}</div>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderTips() {
  const tipsGrid = document.getElementById('tipsGrid');
  tipsGrid.innerHTML = tips.map(tip => `
    <div class="tip-item">
      <h4>${tip.title}</h4>
      <p>${tip.description}</p>
    </div>
  `).join('');
}

function renderFAQ() {
  const faqAccordion = document.getElementById('faqAccordion');
  faqAccordion.innerHTML = faqItems.map((item, index) => `
    <div class="faq-item" data-index="${index}">
      <div class="faq-question">
        <span>${item.question}</span>
        <span class="faq-toggle">▼</span>
      </div>
      <div class="faq-answer">${item.answer}</div>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
      const item = this.parentElement;
      const wasActive = item.classList.contains('active');
      
      // Close all items
      document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
      });
      
      // Open clicked item if it wasn't already open
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────────────

function setupNavigation() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  navToggle.addEventListener('click', function() {
    navToggle.classList.toggle('active');
    navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
  });

  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navToggle.classList.remove('active');
      navMenu.style.display = 'none';
    });
  });

  // Navbar shrink on scroll
  window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(255, 255, 255, 0.98)';
      navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
      navbar.style.background = 'rgba(255, 255, 255, 0.95)';
      navbar.style.boxShadow = 'none';
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────
// SCROLL ANIMATIONS
// ─────────────────────────────────────────────────────────────────────────

function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe recipe cards, tips, and faq items
  document.querySelectorAll('.recipe-card, .tip-item, .food-category, .phase-card, .avoid-item').forEach(el => {
    el.classList.add('scroll-reveal');
    observer.observe(el);
  });
}

// ─────────────────────────────────────────────────────────────────────────
// SMOOTH SCROLL FOR ANCHOR LINKS
// ─────────────────────────────────────────────────────────────────────────

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href !== '#') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// HERO SCROLL BUTTON
// ─────────────────────────────────────────────────────────────────────────

document.querySelector('.hero-scroll')?.addEventListener('click', function() {
  document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
});

// ─────────────────────────────────────────────────────────────────────────
// PERFORMANCE: Lazy load animations on scroll
// ─────────────────────────────────────────────────────────────────────────

window.addEventListener('scroll', function() {
  const scrolled = window.scrollY;
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  
  parallaxElements.forEach(el => {
    el.style.transform = `translateY(${scrolled * 0.5}px)`;
  });
}, { passive: true });