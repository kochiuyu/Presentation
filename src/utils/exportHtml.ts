/**
 * Generates a complete, single-file, 100% self-contained index.html
 * for GitHub Pages or offline local usage without any bundler.
 * Features separated Presentation & Q&A clocks and Random Member Draw for Q&A.
 */
export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOTE5110 Statistical Analysis - Presentation Facilitator</title>
  <meta name="description" content="Classroom presentation manager with separated presentation & Q&A timers, proportional group-size duration, random group picker, random Q&A member draw, Google Forms hub, Web Audio chime, and projector mode.">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
    .font-mono-numbers { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
  <!-- Top Navigation & Status Bar -->
  <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-base shadow-lg shadow-indigo-500/20 text-white">
        CP
      </div>
      <div>
        <h1 id="headerCourseTitle" class="font-bold text-base md:text-lg text-slate-100 leading-tight">DOTE5110 Statistical Analysis</h1>
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span class="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LocalStorage Synced
          </span>
          <span>·</span>
          <span>Press <kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">Space</kbd> Pres, <kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">Q</kbd> Q&A, <kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">A</kbd> Answerer, <kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">N</kbd> Pick</span>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="btnSoundToggle" class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5">
        <span id="soundIcon">🔔</span>
        <span id="soundText">Chime On</span>
      </button>
      <button id="btnTestSound" class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 transition" title="Test lecture hall chime">
        Test Bell
      </button>
      <button id="btnProjector" class="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5">
        <span>📽️</span>
        <span>Projector Mode [P]</span>
      </button>
    </div>
  </header>

  <!-- Main Workspace -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
    <!-- Top Row: Active Group Picker (5 cols) + Separated Timers (7 cols) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Active Group & Roulette Picker (5 cols) -->
      <section class="lg:col-span-5 flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span class="text-xs uppercase tracking-wider font-bold text-indigo-400">Random Group Picker</span>
            <h2 class="text-lg font-bold text-white">Active Presenter</h2>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span id="statPending" class="text-amber-400 font-semibold">8 Pending</span>
            <span class="text-slate-600">/</span>
            <span id="statPresented" class="text-emerald-400 font-semibold">0 Done</span>
          </div>
        </div>

        <!-- Hero Presenter Display -->
        <div id="presenterCard" class="relative overflow-hidden rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-5 flex flex-col items-center justify-center min-h-[190px] text-center transition-all duration-300 shadow-inner">
          <div id="groupBadge" class="hidden px-3.5 py-0.5 mb-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold tracking-wide uppercase">
            NOW ON STAGE
          </div>
          <h3 id="currentGroupName" class="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
            Ready to draw first group
          </h3>
          <div id="currentGroupLeader" class="hidden mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/50 px-2.5 py-0.5 text-xs text-indigo-200 font-semibold">
          </div>
          <div id="currentGroupMembers" class="hidden mt-2.5 w-full bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 text-xs text-slate-300">
          </div>
          <p id="groupSubtext" class="text-xs text-slate-400 mt-2">
            Click &quot;Draw Next Group&quot; or press <kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">N</kbd>
          </p>
        </div>

        <!-- Controls Bar -->
        <div class="flex flex-wrap items-center gap-2.5">
          <button id="btnDrawGroup" class="flex-1 min-w-[170px] py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2">
            <span class="text-base">🎲</span>
            <span>Draw Next Group (N)</span>
          </button>
          <button id="btnResetSession" class="py-3 px-3 rounded-xl text-xs font-semibold border border-rose-900/60 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition" title="Reset presentation session for new class">
            Reset All
          </button>
        </div>

        <!-- Queue Status Summary -->
        <div class="bg-slate-950/70 rounded-xl border border-slate-800 p-3.5">
          <div class="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span>Session Progress</span>
            <span id="progressPercent" class="font-bold text-slate-200">0% Complete (0/8)</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div id="progressBar" class="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div class="font-semibold text-slate-300 mb-1 flex items-center justify-between text-[11px]">
                <span>Remaining</span>
                <span id="badgeRemainingCount" class="text-slate-400 font-mono">8</span>
              </div>
              <ul id="listPending" class="space-y-1 max-h-36 overflow-y-auto pr-1 text-slate-400 text-[11px]"></ul>
            </div>
            <div>
              <div class="font-semibold text-slate-300 mb-1 flex items-center justify-between text-[11px]">
                <span>Presented</span>
                <span id="badgeDoneCount" class="text-emerald-400 font-mono">0</span>
              </div>
              <ul id="listPresented" class="space-y-1 max-h-36 overflow-y-auto pr-1 text-slate-400 text-[11px]"></ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Column: Separated Presentation & Q&A Timers (7 cols) -->
      <section class="lg:col-span-7 flex flex-col justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
        <div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <span class="text-xs uppercase tracking-wider font-bold text-indigo-400">Independent Clocks</span>
              <h2 class="text-lg font-bold text-white">Separated Presentation & Q&A Timers</h2>
            </div>
            <div class="flex items-center gap-1.5 text-xs">
              <span id="tagPresStatus" class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-400">
                Pres Ready
              </span>
              <span id="tagQaStatus" class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-400">
                Q&A Ready
              </span>
            </div>
          </div>

          <!-- Two Dedicated Clocks Side-by-Side -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- CLOCK 1: Presentation Time -->
            <div id="cardPres" class="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between transition-all">
              <div>
                <div class="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                  <div>
                    <span class="text-xs font-bold text-white">🎤 Presentation Time</span>
                    <div id="presFormulaLabel" class="text-[11px] text-indigo-300 font-medium">
                      2m / member (Auto-scales)
                    </div>
                  </div>
                  <span class="text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">PROPORTIONAL</span>
                </div>

                <div class="my-3 text-center">
                  <div id="timerPresDigits" class="font-mono-numbers text-5xl md:text-6xl font-black text-white tracking-tight">
                    16:00
                  </div>
                  <div id="warnPres" class="hidden text-[11px] font-bold text-amber-400 mt-1">⚠️ Final 60 Seconds</div>
                  <div id="overPres" class="hidden text-[11px] font-black text-rose-400 mt-1 animate-pulse">🚨 OVERTIME</div>
                </div>
              </div>

              <div class="space-y-2 mt-2">
                <div class="grid grid-cols-3 gap-1.5">
                  <button id="btnTogglePres" class="col-span-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5 shadow-md">
                    <span id="iconPlayPres">▶</span>
                    <span id="textPlayPres">Start Pres (Space)</span>
                  </button>
                  <button id="btnResetPres" class="py-2.5 px-2 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300">
                    Reset (R)
                  </button>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Nudge Pres:</span>
                  <div class="flex gap-1">
                    <button id="btnAddPresM" class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">+1m</button>
                    <button id="btnSubPresM" class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">-1m</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- CLOCK 2: Q&A Time + Random Respondent Draw -->
            <div id="cardQa" class="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between transition-all">
              <div>
                <div class="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                  <div>
                    <span class="text-xs font-bold text-white">💬 Q&A Discussion</span>
                    <div id="qaFormulaLabel" class="text-[11px] text-emerald-400 font-medium">
                      Fixed 5m (Not proportional)
                    </div>
                  </div>
                  <span class="text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">FIXED</span>
                </div>

                <div class="my-2 text-center">
                  <div id="timerQaDigits" class="font-mono-numbers text-5xl md:text-6xl font-black text-white tracking-tight">
                    05:00
                  </div>
                  <div id="warnQa" class="hidden text-[11px] font-bold text-amber-400 mt-0.5">⚠️ Final 60 Seconds</div>
                  <div id="overQa" class="hidden text-[11px] font-black text-rose-400 mt-0.5 animate-pulse">🚨 OVERTIME</div>
                </div>

                <!-- Q&A Member Draw Box -->
                <div class="my-2 rounded-xl bg-slate-900/90 border border-emerald-900/40 p-2.5 text-center">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">🎯 Q&A Respondent</span>
                    <span id="answeredCountLabel" class="text-[10px] text-slate-400">0 answered</span>
                  </div>

                  <div id="boxRespondentDisplay" class="py-1">
                    <div id="respondentNameTag" class="text-xs font-bold text-slate-400">
                      Press <kbd class="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px]">A</kbd> or click below to pick
                    </div>
                  </div>

                  <button id="btnDrawRespondent" class="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-md transition active:scale-95">
                    <span>🎲 Draw Member to Answer (A)</span>
                  </button>

                  <div id="chipsContainer" class="mt-2 flex flex-wrap justify-center gap-1 max-h-16 overflow-y-auto pt-1"></div>
                </div>
              </div>

              <div class="space-y-2 mt-2">
                <div class="grid grid-cols-3 gap-1.5">
                  <button id="btnToggleQa" class="col-span-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 shadow-md">
                    <span id="iconPlayQa">▶</span>
                    <span id="textPlayQa">Start Q&A (Q)</span>
                  </button>
                  <button id="btnResetQa" class="py-2.5 px-2 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300">
                    Reset
                  </button>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Nudge Q&A:</span>
                  <div class="flex gap-1">
                    <button id="btnAddQaM" class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">+1m</button>
                    <button id="btnSubQaM" class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">-1m</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Quick Rate Selection Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-slate-400 font-semibold">Pres. Rate:</span>
            <div class="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button id="btnQuick2m" class="px-2.5 py-1 rounded text-xs font-bold bg-indigo-600 text-white">2m/member</button>
              <button id="btnQuick1m" class="px-2.5 py-1 rounded text-xs font-semibold text-slate-400 hover:text-white">1m/member</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-400 font-semibold">Q&A Time:</span>
            <div class="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button id="btnQuickQa5" class="px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white">5m Fixed</button>
              <button id="btnQuickQa3" class="px-2.5 py-1 rounded text-xs font-semibold text-slate-400 hover:text-white">3m Fixed</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Bottom Row: Student Forms & Links Hub + Setup Panel -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Student Forms & Links Hub (5 cols) -->
      <section class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-lg">⭐</span>
              <div>
                <span class="text-xs uppercase tracking-wider font-bold text-indigo-400">Class Evaluation</span>
                <h2 class="text-lg font-bold text-white">Peer Evaluation Form</h2>
              </div>
            </div>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/60 text-emerald-300 font-semibold">Active Form</span>
          </div>

          <p class="text-xs text-slate-400 mb-4 leading-relaxed">
            Students and audience members use this Google Form to evaluate each presenting group and submit peer grades in real time.
          </p>

          <div class="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-500/30 shadow-md space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-600/30">
                ⭐
              </div>
              <div class="min-w-0">
                <div class="text-sm font-bold text-slate-200">Student Peer Evaluation Form</div>
                <div id="labelPeerUrl" class="text-xs text-indigo-300 truncate max-w-[220px] font-mono">https://forms.gle/bKtEYEEkvUy3F4mt6</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <button id="btnOpenPeerForm" class="py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5 shadow-md">
                <span>Open Form ↗</span>
              </button>
              <button id="btnQrPeerForm" class="py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center gap-1.5">
                <span>📱 QR Code</span>
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Form link automatically persists in localStorage</span>
          <span class="text-slate-400">Classroom Ready</span>
        </div>
      </section>

      <!-- Setup & Initialization Panel (7 cols) -->
      <section class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-bold text-sky-400">Class Setup & Timings</span>
            <h2 class="text-lg font-bold text-white">Course & Roster Configuration</h2>
          </div>
          <button id="btnLoadSample" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Reset to DOTE5110 Default Roster
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Course Title</label>
            <input id="inputCourseTitle" type="text" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none" value="DOTE5110 Statistical Analysis">
          </div>

          <!-- Proportional Timing Configuration -->
          <div class="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
            <div class="text-xs font-bold text-indigo-300">
              ⚡ Timer Limits (Proportional to Group Size vs Fixed)
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span class="block text-slate-300 font-semibold mb-1">Presentation Phase:</span>
                <select id="selectPresRate" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono">
                  <option value="2">2 min per member (Default)</option>
                  <option value="1">1 min per member</option>
                  <option value="1.5">1.5 min per member</option>
                  <option value="0">Fixed 10 min total</option>
                </select>
              </div>

              <div>
                <span class="block text-slate-300 font-semibold mb-1">Q&A Phase:</span>
                <select id="selectQaTime" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono">
                  <option value="5">Fixed 5 min (Default)</option>
                  <option value="3">Fixed 3 min</option>
                  <option value="2">Fixed 2 min</option>
                  <option value="prop">Proportional (0.5m/member)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-semibold text-slate-300">
                Student Groups & Roster <span class="text-slate-500 font-normal">(Paste Google Sheets CSV, TSV, or plain names)</span>
              </label>
              <span id="detectedCountBadge" class="text-[11px] font-mono text-indigo-400">8 groups detected</span>
            </div>
            <textarea id="inputGroupList" rows="5" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none leading-relaxed"></textarea>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-slate-300">Peer Evaluation Google Form URL</label>
              <span class="text-[11px] text-indigo-400 font-medium">Audience Feedback Form</span>
            </div>
            <input id="inputPeerUrl" type="url" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none" value="https://forms.gle/bKtEYEEkvUy3F4mt6">
            <p class="mt-1 text-[11px] text-slate-500">Configured URL: <span class="text-slate-400 font-mono">https://forms.gle/bKtEYEEkvUy3F4mt6</span></p>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span class="text-xs text-slate-400">Changes persist automatically in browser localStorage</span>
            <button id="btnInitGroups" class="py-2.5 px-6 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white shadow-md shadow-indigo-600/30 transition">
              Apply Changes & Save
            </button>
          </div>
        </div>
      </section>
    </div>
  </main>

  <!-- Fullscreen Projector Mode Overlay (Dual Clocks + Q&A Respondent Banner) -->
  <div id="projectorModal" class="hidden fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 md:p-10 transition-all">
    <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black tracking-widest uppercase">PROJECTOR VIEW</span>
        <h2 id="projCourseTitle" class="text-xl md:text-2xl font-black text-slate-200">DOTE5110 Statistical Analysis</h2>
      </div>
      <div class="flex items-center gap-3">
        <button id="btnProjQrToggle" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
          📱 Show Student QR
        </button>
        <button id="btnCloseProjector" class="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600/80 hover:bg-rose-500 text-white">
          Exit Projector [Esc]
        </button>
      </div>
    </div>

    <!-- Center Stage: Giant Name & Separated Side-by-Side Dual Timers -->
    <div class="flex-1 flex flex-col items-center justify-center text-center my-2 max-w-6xl mx-auto w-full">
      <div id="projDrawBadge" class="hidden inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-400/50 px-4 py-1 text-xs font-black uppercase tracking-widest text-amber-300 mb-2 animate-pulse">
        🎲 RANDOMLY DRAWING NEXT GROUP...
      </div>

      <div id="projGroupName" class="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-1">
        Ready to Begin
      </div>

      <div id="projGroupRoster" class="mb-2 flex flex-col items-center gap-1 max-w-4xl">
        <div id="projLeaderTag" class="hidden inline-flex items-center gap-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 px-3.5 py-0.5 text-xs sm:text-sm text-indigo-200 font-bold shadow-md">
        </div>
      </div>

      <!-- PROMINENT CALL TO ANSWER BANNER IN PROJECTOR -->
      <div id="projRespondentBanner" class="w-full max-w-3xl my-2">
        <div id="projRespInner" class="rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 p-3 text-center shadow-xl shadow-emerald-500/10">
          <span class="text-xs font-black uppercase tracking-widest text-emerald-400">
            🎯 SELECTED TO ANSWER THE QUESTION:
          </span>
          <div id="projRespondentName" class="text-2xl md:text-4xl font-black text-white tracking-tight leading-snug mt-0.5">
            Press A to Draw Member
          </div>
        </div>
      </div>

      <!-- Dual Clocks Side-by-Side in Projector -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl my-2">
        
        <!-- PROJ CLOCK 1: Presentation -->
        <div id="projCardPres" class="rounded-3xl border-2 border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center justify-center transition-all">
          <div class="text-xs sm:text-sm font-black uppercase tracking-widest text-indigo-300 mb-2">
            🎤 PRESENTATION TIME (PROPORTIONAL)
          </div>
          <div id="projTimerPresDigits" class="font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-none my-1">
            16:00
          </div>
          <div class="mt-3 flex items-center gap-2">
            <button id="btnProjTogglePres" class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md">
              Start/Pause Pres (Space)
            </button>
            <button id="btnProjResetPres" class="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
              Reset
            </button>
          </div>
          <div id="projOverPres" class="hidden mt-2 text-xs font-black text-rose-400 uppercase animate-pulse">
            🚨 PRESENTATION OVERTIME
          </div>
        </div>

        <!-- PROJ CLOCK 2: Q&A -->
        <div id="projCardQa" class="rounded-3xl border-2 border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center justify-center transition-all">
          <div class="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-300 mb-2">
            💬 Q&A DISCUSSION (5M FIXED)
          </div>
          <div id="projTimerQaDigits" class="font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-none my-1">
            05:00
          </div>
          <div class="mt-3 flex items-center gap-2">
            <button id="btnProjToggleQa" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">
              Start/Pause Q&A (Q)
            </button>
            <button id="btnProjResetQa" class="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
              Reset
            </button>
            <button id="btnProjDrawAnswerer" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1">
              <span>🎲 Draw Answerer (A)</span>
            </button>
          </div>
          <div id="projOverQa" class="hidden mt-2 text-xs font-black text-rose-400 uppercase animate-pulse">
            🚨 Q&A OVERTIME
          </div>
        </div>

      </div>

      <!-- Pool of Remaining Groups on Projector -->
      <div id="projPoolContainer" class="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/80 p-3 mt-2 text-left">
        <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 text-xs">
          <div class="flex items-center gap-2 font-bold text-slate-200">
            <span class="h-2 w-2 rounded-full bg-amber-400"></span>
            <span>Pool of Remaining Groups (<span id="projPendingCount">0</span> Waiting)</span>
          </div>
          <div class="text-[11px] text-slate-400">
            <span id="projDoneCount" class="text-emerald-400 font-semibold">0 presented</span>
          </div>
        </div>
        <div id="projPoolChips" class="flex flex-wrap items-center justify-center gap-1.5 max-h-24 overflow-y-auto">
        </div>
      </div>
    </div>

    <!-- Bottom Controls in Projector Mode -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
      <div class="hidden sm:flex items-center gap-4">
        <span><kbd class="px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">Space</kbd> Pres</span>
        <span><kbd class="px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">Q</kbd> Q&A</span>
        <span><kbd class="px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">A</kbd> Draw Answerer</span>
        <span><kbd class="px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">N</kbd> Next Group</span>
        <span><kbd class="px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">R</kbd> Reset Pres</span>
      </div>
      <div class="flex items-center gap-2">
        <button id="btnProjPoolToggle" class="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">Toggle Pool</button>
        <button id="btnProjResetAll" class="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/50 text-rose-300">Reset All</button>
        <button id="btnProjDraw" class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white">Draw Next Group (N)</button>
      </div>
    </div>
  </div>

  <!-- QR Code Modal -->
  <div id="qrModal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 id="qrModalTitle" class="text-lg font-bold text-white mb-1">Scan Form Link</h3>
      <p id="qrModalUrl" class="text-xs text-slate-400 mb-4 truncate"></p>
      <div class="bg-white p-4 rounded-xl flex items-center justify-center mx-auto w-56 h-56 shadow-inner">
        <img id="qrImage" src="" alt="QR Code" class="w-full h-full object-contain">
      </div>
      <div class="mt-5 flex gap-2">
        <a id="qrOpenExternal" href="#" target="_blank" rel="noopener noreferrer" class="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white">Open in Tab</a>
        <button id="btnCloseQrModal" class="py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200">Close</button>
      </div>
    </div>
  </div>

  <!-- Web Audio Synthesizer & Logic -->
  <script>
    let audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) audioCtx = new AudioClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }

    function playTick() {
      if (!state.soundEnabled) return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }

    function playChime() {
      if (!state.soundEnabled) return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      const now = ctx.currentTime;
      freqs.forEach((f, i) => {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1.85);
      });
    }

    function playWarningChime() {
      if (!state.soundEnabled) return;
      const ctx = getAudioCtx();
      if (!ctx) return;
      [659.25, 880.0].forEach((f, i) => {
        const t = ctx.currentTime + i * 0.16;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.85);
      });
    }

    function parseCsvRow(row, delimiter = ',') {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    function parseRosterInput(input) {
      if (!input || !input.trim()) return [];
      const rawLines = input.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
      if (rawLines.length === 0) return [];

      const firstLine = rawLines[0].toLowerCase();
      const delimiter = rawLines[0].includes('\\t') ? '\\t' : ',';
      const isSheetTable = firstLine.includes('group') && (firstLine.includes('leader') || firstLine.includes('member'));

      if (isSheetTable) {
        const headerCols = parseCsvRow(rawLines[0], delimiter).map(h => h.toLowerCase());
        const groupNameIdx = headerCols.findIndex(h => h.includes('group'));
        const leaderIdx = headerCols.findIndex(h => h.includes('leader'));
        const groups = [];

        for (let i = 1; i < rawLines.length; i++) {
          const cols = parseCsvRow(rawLines[i], delimiter);
          const name = cols[groupNameIdx >= 0 ? groupNameIdx : 0];
          if (!name) continue;
          const leader = leaderIdx >= 0 ? cols[leaderIdx] : undefined;
          const rawMembers = [];
          cols.forEach((col, idx) => {
            if (idx !== groupNameIdx && col && col.length > 0) rawMembers.push(col);
          });
          const uniqueMembers = [];
          const seen = new Set();
          rawMembers.forEach(m => {
            const norm = m.trim().toLowerCase();
            if (norm && !seen.has(norm)) { seen.add(norm); uniqueMembers.push(m.trim()); }
          });
          groups.push({
            name: name.trim(),
            leader: leader ? leader.trim() : undefined,
            members: uniqueMembers
          });
        }
        if (groups.length > 0) return groups;
      }

      return rawLines.map(line => ({ name: line }));
    }

    const STORAGE_KEY = 'dote5110_presenter_data_v6';
    const DEFAULT_GOOGLE_SHEET_CSV = \`Group Name,Leader,Member 1,Member 2,Member 3,Member 4,Member 5,Member 6,Member 7,Member 8
ITM Pass,CHAN Chun Ming (Danny),CHAN Chun Ming (Danny),CHOW Sik Hong (Eric),WAN Wing Wai (Michelle),LAM Ka Ho (Danny),Wong Yin Yee (Jess),Lam Kai Yi (Kelly),Zhang Yi Chi(Adam),Wang Shengping (Spencer)
Group 1,Tan Tsz Ching (Iris),Ng Kei Ming Kevin,Liu Tsun Yee (Matt),"Kan Pok Shing, Harry",CHAN CHUN YIN (Tom),Cheung Ting Fung (Tito),Chan Ka Chun (EricB),Tan Tsz Ching (Iris),
GIGO,CHAN Hoi Ho (Thomas),Lai Chun Man (Edward),Ho Lok Yiu (Kenix),FUNG Phillis,CHAN Hoi Ho (Thomas),Yeung Chin Wai (Charlotte),"WAN Ka Wing, Daniel",,
Group 3,Szeto Wing Yan (Queenie),WONG Oi Lam (Tac),Ng Kit Yee (Kit),Chieh Kwong Wing (William),Wong Ho Hay Edgar,Ng Hau Yin (Mandy),Ching Lok Yan (Ada),Szeto Wing Yan (Queenie),
jager bomb,Cheng Man Hin,Lam Tsz Lok Dennis,Yeung Hoi Ying Daisy,Chan Jian Xi Elvis,Ma Tsz Yan,Lo Chun Hang Leo,Chan Gi Wei Violet,Gao Ying Ying,
Ctrl + Six,Tsoi Wing Sze (Celia) ,Yung Ching Lam (Kimberly),Li Yuk Yu (Sherena),Tsoi Wing Sze (Celia) ,Lam Ching Wing (Andrea),Wong Wai (Angela),Lai Kit Sum (Kennis),,
Last but not Beast,Wong Yu Kin Ivan,Law Yu Tung (Sabine),Ho Kai Ching (Matt),LEUNG Yi Kit (Ricky),CHEUNG KWOK LUEN (Anson),LEE KA HONG (Ka-hong),Wong Yu Kin Ivan,WONG Hon Lung (Barron),
DataPandas,HAO Chunhui (Nick) ,CHEUNG Kai leuk (Ken),ZHANG Jiamin Cathie,LEE Chun Kit (Ivan),WONG IOK SENG (Samuel),HAO Chunhui (Nick) ,Wong Sung Him (Tony),Lam Nga Mei (May),LI Kai Ming (Kasu)\`;

    let state = {
      courseTitle: "DOTE5110 Statistical Analysis",
      rawGroupInput: DEFAULT_GOOGLE_SHEET_CSV,
      pendingGroups: parseRosterInput(DEFAULT_GOOGLE_SHEET_CSV),
      presentedGroups: [],
      currentGroup: null,
      currentRespondent: null,
      answeredMembers: [],
      presRate: 2,
      presFixed: 14,
      qaFixed: 5,
      qaRate: 0.5,
      isPresProp: true,
      isQaProp: false,
      peerUrl: "https://forms.gle/bKtEYEEkvUy3F4mt6",
      soundEnabled: true
    };

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          Object.assign(state, parsed);
          if (!state.peerUrl || state.peerUrl.includes('peer-eval-demo')) {
            state.peerUrl = "https://forms.gle/bKtEYEEkvUy3F4mt6";
          }
        }
      } catch(e) {}
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch(e) {}
    }

    let presSeconds = 16 * 60;
    let presRunning = false;
    let hasWarnedPres = false;

    let qaSeconds = 5 * 60;
    let qaRunning = false;
    let hasWarnedQa = false;

    let isShufflingRespondent = false;
    let masterInterval = null;
    let isShuffling = false;

    function getPresMins(group = state.currentGroup) {
      const memberCount = group && group.members && group.members.length > 0 ? group.members.length : 7;
      return state.isPresProp ? Math.round(memberCount * state.presRate * 10) / 10 : state.presFixed;
    }

    function getQaMins(group = state.currentGroup) {
      const memberCount = group && group.members && group.members.length > 0 ? group.members.length : 7;
      return state.isQaProp ? Math.round(memberCount * state.qaRate * 10) / 10 : state.qaFixed;
    }

    function formatTime(secs) {
      const isNeg = secs < 0;
      const abs = Math.abs(secs);
      const m = Math.floor(abs / 60);
      const s = abs % 60;
      return (isNeg ? '+' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function updateTimersUI() {
      const pStr = formatTime(presSeconds);
      document.getElementById('timerPresDigits').textContent = pStr;
      document.getElementById('projTimerPresDigits').textContent = pStr;

      const overP = document.getElementById('overPres');
      const warnP = document.getElementById('warnPres');
      const projOverP = document.getElementById('projOverPres');

      if (presSeconds <= 0) {
        document.getElementById('timerPresDigits').className = "font-mono-numbers text-5xl md:text-6xl font-black text-rose-500 animate-pulse";
        document.getElementById('projTimerPresDigits').className = "font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-rose-500 animate-pulse";
        overP.classList.remove('hidden');
        warnP.classList.add('hidden');
        projOverP.classList.remove('hidden');
      } else if (presSeconds <= 60) {
        document.getElementById('timerPresDigits').className = "font-mono-numbers text-5xl md:text-6xl font-black text-amber-400";
        document.getElementById('projTimerPresDigits').className = "font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-amber-400";
        overP.classList.add('hidden');
        warnP.classList.remove('hidden');
        projOverP.classList.add('hidden');
      } else {
        document.getElementById('timerPresDigits').className = "font-mono-numbers text-5xl md:text-6xl font-black text-white";
        document.getElementById('projTimerPresDigits').className = "font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white";
        overP.classList.add('hidden');
        warnP.classList.add('hidden');
        projOverP.classList.add('hidden');
      }

      const qStr = formatTime(qaSeconds);
      document.getElementById('timerQaDigits').textContent = qStr;
      document.getElementById('projTimerQaDigits').textContent = qStr;

      const overQ = document.getElementById('overQa');
      const warnQ = document.getElementById('warnQa');
      const projOverQ = document.getElementById('projOverQa');

      if (qaSeconds <= 0) {
        document.getElementById('timerQaDigits').className = "font-mono-numbers text-5xl md:text-6xl font-black text-rose-500 animate-pulse";
        document.getElementById('projTimerQaDigits').className = "font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-rose-500 animate-pulse";
        overQ.classList.remove('hidden');
        warnQ.classList.add('hidden');
        projOverQ.classList.remove('hidden');
      } else if (qaSeconds <= 60) {
        document.getElementById('timerQaDigits').className = "font-mono-numbers text-5xl md:text-6xl font-black text-amber-400";
        document.getElementById('projTimerQaDigits').className = "font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-amber-400";
        overQ.classList.add('hidden');
        warnQ.classList.remove('hidden');
        projOverQ.classList.add('hidden');
      } else {
        document.getElementById('timerQaDigits').className = "font-mono-numbers text-5xl md:text-6xl font-black text-white";
        document.getElementById('projTimerQaDigits').className = "font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white";
        overQ.classList.add('hidden');
        warnQ.classList.add('hidden');
        projOverQ.classList.add('hidden');
      }
    }

    function startMasterTicker() {
      if (masterInterval) return;
      masterInterval = setInterval(() => {
        if (presRunning) {
          presSeconds--;
          if (presSeconds === 60 && !hasWarnedPres) {
            hasWarnedPres = true;
            playWarningChime();
          }
          if (presSeconds === 0) {
            playChime();
            if (typeof confetti === 'function') confetti({ particleCount: 50, spread: 60 });
          }
        }

        if (qaRunning) {
          qaSeconds--;
          if (qaSeconds === 60 && !hasWarnedQa) {
            hasWarnedQa = true;
            playWarningChime();
          }
          if (qaSeconds === 0) {
            playChime();
            if (typeof confetti === 'function') confetti({ particleCount: 40, spread: 60 });
          }
        }

        updateTimersUI();
      }, 1000);
    }

    function togglePres() {
      getAudioCtx();
      presRunning = !presRunning;
      document.getElementById('textPlayPres').textContent = presRunning ? 'Pause Pres (Space)' : 'Start Pres (Space)';
      document.getElementById('iconPlayPres').textContent = presRunning ? '⏸' : '▶';
      document.getElementById('btnTogglePres').className = presRunning
        ? 'col-span-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white transition flex items-center justify-center gap-1.5 shadow-md'
        : 'col-span-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5 shadow-md';

      document.getElementById('tagPresStatus').textContent = presRunning ? '🎤 Pres Running' : 'Pres Ready';
      document.getElementById('tagPresStatus').className = presRunning
        ? 'px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 border border-indigo-400 text-indigo-300 animate-pulse'
        : 'px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-400';

      document.getElementById('cardPres').className = presRunning
        ? 'rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 ring-2 ring-indigo-500/30 p-4 flex flex-col justify-between transition-all'
        : 'rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between transition-all';

      document.getElementById('projCardPres').className = presRunning
        ? 'rounded-3xl border-2 border-indigo-400 bg-gradient-to-b from-indigo-950/50 to-slate-950 ring-4 ring-indigo-500/30 p-6 flex flex-col items-center justify-center transition-all'
        : 'rounded-3xl border-2 border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center justify-center transition-all';

      startMasterTicker();
    }

    function resetPres() {
      presRunning = false;
      hasWarnedPres = false;
      presSeconds = Math.round(getPresMins() * 60);
      document.getElementById('textPlayPres').textContent = 'Start Pres (Space)';
      document.getElementById('iconPlayPres').textContent = '▶';
      document.getElementById('btnTogglePres').className = 'col-span-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5 shadow-md';
      document.getElementById('tagPresStatus').textContent = 'Pres Ready';
      document.getElementById('tagPresStatus').className = 'px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-400';
      document.getElementById('cardPres').className = 'rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between transition-all';
      document.getElementById('projCardPres').className = 'rounded-3xl border-2 border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center justify-center transition-all';
      updateTimersUI();
    }

    function toggleQa() {
      getAudioCtx();
      qaRunning = !qaRunning;
      if (qaRunning && presRunning) {
        togglePres();
      }
      document.getElementById('textPlayQa').textContent = qaRunning ? 'Pause Q&A (Q)' : 'Start Q&A (Q)';
      document.getElementById('iconPlayQa').textContent = qaRunning ? '⏸' : '▶';
      document.getElementById('btnToggleQa').className = qaRunning
        ? 'col-span-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white transition flex items-center justify-center gap-1.5 shadow-md'
        : 'col-span-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 shadow-md';

      document.getElementById('tagQaStatus').textContent = qaRunning ? '💬 Q&A Running' : 'Q&A Ready';
      document.getElementById('tagQaStatus').className = qaRunning
        ? 'px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 border border-emerald-400 text-emerald-300 animate-pulse'
        : 'px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-400';

      document.getElementById('cardQa').className = qaRunning
        ? 'rounded-2xl border-2 border-emerald-500 bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 ring-2 ring-emerald-500/30 p-4 flex flex-col justify-between transition-all'
        : 'rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between transition-all';

      document.getElementById('projCardQa').className = qaRunning
        ? 'rounded-3xl border-2 border-emerald-400 bg-gradient-to-b from-emerald-950/50 to-slate-950 ring-4 ring-emerald-500/30 p-6 flex flex-col items-center justify-center transition-all'
        : 'rounded-3xl border-2 border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center justify-center transition-all';

      startMasterTicker();
    }

    function resetQa() {
      qaRunning = false;
      hasWarnedQa = false;
      qaSeconds = Math.round(getQaMins() * 60);
      document.getElementById('textPlayQa').textContent = 'Start Q&A (Q)';
      document.getElementById('iconPlayQa').textContent = '▶';
      document.getElementById('btnToggleQa').className = 'col-span-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 shadow-md';
      document.getElementById('tagQaStatus').textContent = 'Q&A Ready';
      document.getElementById('tagQaStatus').className = 'px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-400';
      document.getElementById('cardQa').className = 'rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between transition-all';
      document.getElementById('projCardQa').className = 'rounded-3xl border-2 border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center justify-center transition-all';
      updateTimersUI();
    }

    function drawRespondent() {
      if (isShufflingRespondent) return;
      const group = state.currentGroup;
      if (!group || !group.members || !group.members.length) {
        alert("Please draw or select a group first.");
        return;
      }

      getAudioCtx();
      isShufflingRespondent = true;
      const uncalled = group.members.filter(m => !state.answeredMembers.includes(m));
      const pool = uncalled.length > 0 ? uncalled : group.members;

      let speed = 40;
      let iterations = 0;
      const maxIter = 18;

      function step() {
        const randIdx = Math.floor(Math.random() * pool.length);
        const temp = pool[randIdx];
        document.getElementById('respondentNameTag').textContent = "🎲 " + temp;
        document.getElementById('projRespondentName').textContent = temp;
        playTick();
        iterations++;

        if (iterations < maxIter) {
          speed += 14;
          setTimeout(step, speed);
        } else {
          const picked = pool[randIdx];
          isShufflingRespondent = false;
          state.currentRespondent = picked;
          if (!state.answeredMembers.includes(picked)) {
            state.answeredMembers.push(picked);
          }
          saveState();

          document.getElementById('respondentNameTag').innerHTML = \`<span class="text-white bg-emerald-950/80 border border-emerald-600 px-2 py-0.5 rounded-md font-bold">🎯 \${picked}</span>\`;
          document.getElementById('projRespondentName').textContent = picked;
          document.getElementById('answeredCountLabel').textContent = \`\${state.answeredMembers.length} answered\`;

          renderRespondentChips();
          if (typeof confetti === 'function') confetti({ particleCount: 40, spread: 60 });
        }
      }
      step();
    }

    function renderRespondentChips() {
      const container = document.getElementById('chipsContainer');
      const group = state.currentGroup;
      if (!group || !group.members) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = group.members.map(m => {
        const isDone = state.answeredMembers.includes(m);
        const isCurrent = state.currentRespondent === m;
        return \`<button onclick="selectRespondentDirectly('\${m.replace(/'/g, "\\\\'")}')" class="text-[10px] px-1.5 py-0.5 rounded border \${
          isCurrent ? 'bg-emerald-600 border-emerald-400 text-white font-bold' :
          isDone ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400' :
          'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
        }">\${isDone ? '✓ ' : ''}\${m.split('(')[0].trim()}</button>\`;
      }).join('');
    }

    function selectRespondentDirectly(name) {
      state.currentRespondent = name;
      if (!state.answeredMembers.includes(name)) state.answeredMembers.push(name);
      saveState();
      document.getElementById('respondentNameTag').innerHTML = \`<span class="text-white bg-emerald-950/80 border border-emerald-600 px-2 py-0.5 rounded-md font-bold">🎯 \${name}</span>\`;
      document.getElementById('projRespondentName').textContent = name;
      document.getElementById('answeredCountLabel').textContent = \`\${state.answeredMembers.length} answered\`;
      renderRespondentChips();
    }

    function drawNextGroup() {
      if (isShuffling) return;
      if (!state.pendingGroups.length) {
        alert("All groups have presented in this session! Click 'Reset All' to start a new round.");
        return;
      }

      getAudioCtx();
      isShuffling = true;
      const currentEl = document.getElementById('currentGroupName');
      const projNameEl = document.getElementById('projGroupName');
      const badgeEl = document.getElementById('groupBadge');
      const projBadge = document.getElementById('projDrawBadge');

      badgeEl.classList.remove('hidden');
      badgeEl.textContent = "SHUFFLING...";
      badgeEl.className = "px-3.5 py-0.5 mb-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold tracking-wide uppercase animate-pulse";
      if (projBadge) projBadge.classList.remove('hidden');

      let speed = 40;
      let counter = 0;
      const totalSteps = 24;

      function step() {
        const randIdx = Math.floor(Math.random() * state.pendingGroups.length);
        const candidate = state.pendingGroups[randIdx];
        currentEl.textContent = candidate.name;
        projNameEl.textContent = candidate.name;
        playTick();
        counter++;

        if (counter < totalSteps) {
          speed += 12;
          setTimeout(step, speed);
        } else {
          const finalPick = state.pendingGroups.splice(randIdx, 1)[0];
          state.currentGroup = finalPick;
          state.currentRespondent = null;
          state.answeredMembers = [];
          state.presentedGroups.push(finalPick);
          saveState();
          renderGroupLists();

          currentEl.textContent = finalPick.name;
          projNameEl.textContent = finalPick.name;
          badgeEl.textContent = "NOW ON STAGE";
          badgeEl.className = "px-3.5 py-0.5 mb-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold tracking-wide uppercase";
          if (projBadge) projBadge.classList.add('hidden');

          renderActiveGroupRoster(finalPick);

          document.getElementById('respondentNameTag').textContent = "Press A or click below to pick";
          document.getElementById('projRespondentName').textContent = "Press A to Draw Member";
          document.getElementById('answeredCountLabel').textContent = "0 answered";
          renderRespondentChips();

          resetPres();
          resetQa();

          isShuffling = false;

          if (typeof confetti === 'function') {
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          }
        }
      }
      step();
    }

    function renderActiveGroupRoster(group) {
      const leaderEl = document.getElementById('currentGroupLeader');
      const membersEl = document.getElementById('currentGroupMembers');
      const projLeader = document.getElementById('projLeaderTag');
      const presFormula = document.getElementById('presFormulaLabel');

      if (!group) {
        leaderEl.classList.add('hidden');
        membersEl.classList.add('hidden');
        projLeader.classList.add('hidden');
        return;
      }

      const memCount = group.members ? group.members.length : 7;
      const presM = getPresMins(group);
      presFormula.textContent = state.isPresProp ? \`\${memCount} members × \${state.presRate}m = \${presM}m total\` : \`Fixed \${presM}m\`;

      if (group.leader) {
        leaderEl.innerHTML = \`<span>👑 Group Leader:</span> <span class="text-white">\${group.leader}</span>\`;
        leaderEl.classList.remove('hidden');
        projLeader.innerHTML = \`<span>👑 Leader:</span> <span class="text-white">\${group.leader}</span>\`;
        projLeader.classList.remove('hidden');
      } else {
        leaderEl.classList.add('hidden');
        projLeader.classList.add('hidden');
      }

      if (group.members && group.members.length > 0) {
        membersEl.innerHTML = \`<div class="font-bold uppercase tracking-wider text-slate-400 mb-1 text-[11px]">Team Members (\${group.members.length})</div><div class="flex flex-wrap justify-center gap-1">\${group.members.map(m => \`<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200">\${m}</span>\`).join('')}</div>\`;
        membersEl.classList.remove('hidden');
      } else {
        membersEl.classList.add('hidden');
      }
    }

    function renderGroupLists() {
      const total = state.pendingGroups.length + state.presentedGroups.length;
      const done = state.presentedGroups.length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);

      document.getElementById('statPending').textContent = \`\${state.pendingGroups.length} Pending\`;
      document.getElementById('statPresented').textContent = \`\${done} Done\`;
      document.getElementById('progressPercent').textContent = \`\${pct}% Complete (\${done}/\${total})\`;
      document.getElementById('progressBar').style.width = \`\${pct}%\`;
      document.getElementById('badgeRemainingCount').textContent = state.pendingGroups.length;
      document.getElementById('badgeDoneCount').textContent = done;

      const pendUl = document.getElementById('listPending');
      pendUl.innerHTML = state.pendingGroups.length 
        ? state.pendingGroups.map((g, i) => '<li class="truncate py-0.5 border-b border-slate-900/60 flex items-center justify-between"><span class="truncate"><span class="text-slate-500 font-mono text-[10px] mr-1">' + (i + 1) + '.</span>' + g.name + '</span>' + (g.members && g.members.length ? '<span class="text-[10px] text-slate-500 font-mono">' + g.members.length + 'p</span>' : '') + '</li>').join('')
        : '<li class="text-slate-600 italic">None left</li>';

      const doneUl = document.getElementById('listPresented');
      doneUl.innerHTML = state.presentedGroups.length
        ? state.presentedGroups.map((g) => '<li class="truncate py-0.5 border-b border-slate-900/60 flex items-center justify-between"><span class="truncate text-emerald-400/90 font-medium">✓ ' + g.name + '</span></li>').join('')
        : '<li class="text-slate-600 italic">None yet</li>';

      // Projector pool sync
      const projPendingEl = document.getElementById('projPendingCount');
      if (projPendingEl) projPendingEl.textContent = state.pendingGroups.length;
      const projDoneEl = document.getElementById('projDoneCount');
      if (projDoneEl) projDoneEl.textContent = done + ' presented';
      const projChips = document.getElementById('projPoolChips');
      if (projChips) {
        projChips.innerHTML = state.pendingGroups.length
          ? state.pendingGroups.map((g, i) => '<span class="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950/80 text-[11px] text-slate-300 font-medium">' + (i + 1) + '. ' + g.name + (g.members && g.members.length ? ' (' + g.members.length + 'p)' : '') + '</span>').join('')
          : '<span class="text-xs text-emerald-400 font-bold">🎉 All groups in the pool have presented!</span>';
      }

      if (state.currentGroup) {
        document.getElementById('currentGroupName').textContent = state.currentGroup.name;
        document.getElementById('projGroupName').textContent = state.currentGroup.name;
        document.getElementById('groupBadge').classList.remove('hidden');
        renderActiveGroupRoster(state.currentGroup);
      } else {
        document.getElementById('currentGroupName').textContent = "No Group Selected Yet";
        document.getElementById('projGroupName').textContent = "Ready to Begin";
        document.getElementById('groupBadge').classList.add('hidden');
        renderActiveGroupRoster(null);
      }
    }

    function initializeGroupsFromInput() {
      const raw = document.getElementById('inputGroupList').value.trim();
      const course = document.getElementById('inputCourseTitle').value.trim() || "DOTE5110 Statistical Analysis";
      const presSel = document.getElementById('selectPresRate').value;
      const qaSel = document.getElementById('selectQaTime').value;
      const peerUrl = (document.getElementById('inputPeerUrl')?.value || '').trim() || "https://forms.gle/bKtEYEEkvUy3F4mt6";

      const items = parseRosterInput(raw);
      if (!items.length) {
        alert("Please enter at least one group name or paste your Google Sheet CSV.");
        return;
      }

      state.courseTitle = course;
      state.rawGroupInput = raw;
      state.pendingGroups = [...items];
      state.presentedGroups = [];
      state.currentGroup = null;
      state.currentRespondent = null;
      state.answeredMembers = [];

      if (presSel === '0') {
        state.isPresProp = false;
        state.presFixed = 10;
      } else {
        state.isPresProp = true;
        state.presRate = parseFloat(presSel);
      }

      if (qaSel === 'prop') {
        state.isQaProp = true;
        state.qaRate = 0.5;
      } else {
        state.isQaProp = false;
        state.qaFixed = parseInt(qaSel) || 5;
      }

      state.peerUrl = peerUrl;

      saveState();
      syncUI();
      alert('Successfully saved ' + course + ' with ' + items.length + ' groups and separated timers!');
    }

    function syncUI() {
      document.getElementById('headerCourseTitle').textContent = state.courseTitle;
      document.getElementById('projCourseTitle').textContent = state.courseTitle;
      document.getElementById('inputCourseTitle').value = state.courseTitle;
      document.getElementById('inputGroupList').value = state.rawGroupInput;
      document.getElementById('selectPresRate').value = state.isPresProp ? String(state.presRate) : '0';
      document.getElementById('selectQaTime').value = state.isQaProp ? 'prop' : String(state.qaFixed);
      if (document.getElementById('inputPeerUrl')) document.getElementById('inputPeerUrl').value = state.peerUrl;
      if (document.getElementById('labelPeerUrl')) document.getElementById('labelPeerUrl').textContent = state.peerUrl;

      renderGroupLists();
      renderRespondentChips();
      resetPres();
      resetQa();
    }

    function openQrModal(title, url) {
      if (!url) {
        alert("No URL configured yet for this form.");
        return;
      }
      document.getElementById('qrModalTitle').textContent = title;
      document.getElementById('qrModalUrl').textContent = url;
      document.getElementById('qrOpenExternal').href = url;
      document.getElementById('qrImage').src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(url);
      document.getElementById('qrModal').classList.remove('hidden');
    }

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePres();
      } else if (e.key.toLowerCase() === 'q') {
        e.preventDefault();
        toggleQa();
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        drawRespondent();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        drawNextGroup();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        document.getElementById('projectorModal').classList.toggle('hidden');
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (e.shiftKey) resetQa();
        else resetPres();
      } else if (e.key === 'Escape') {
        document.getElementById('projectorModal').classList.add('hidden');
        document.getElementById('qrModal').classList.add('hidden');
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      loadState();
      syncUI();

      document.getElementById('btnSoundToggle').addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        document.getElementById('soundIcon').textContent = state.soundEnabled ? '🔔' : '🔕';
        document.getElementById('soundText').textContent = state.soundEnabled ? 'Chime On' : 'Muted';
        saveState();
      });

      document.getElementById('btnTestSound').addEventListener('click', () => {
        getAudioCtx();
        playChime();
      });

      document.getElementById('btnProjector').addEventListener('click', () => {
        document.getElementById('projectorModal').classList.remove('hidden');
      });
      document.getElementById('btnCloseProjector').addEventListener('click', () => {
        document.getElementById('projectorModal').classList.add('hidden');
      });

      // Presentation Controls
      document.getElementById('btnTogglePres').addEventListener('click', togglePres);
      document.getElementById('btnProjTogglePres').addEventListener('click', togglePres);
      document.getElementById('btnResetPres').addEventListener('click', resetPres);
      document.getElementById('btnProjResetPres').addEventListener('click', resetPres);
      document.getElementById('btnAddPresM').addEventListener('click', () => { presSeconds += 60; updateTimersUI(); });
      document.getElementById('btnSubPresM').addEventListener('click', () => { presSeconds = Math.max(0, presSeconds - 60); updateTimersUI(); });

      // Q&A Controls
      document.getElementById('btnToggleQa').addEventListener('click', toggleQa);
      document.getElementById('btnProjToggleQa').addEventListener('click', toggleQa);
      document.getElementById('btnResetQa').addEventListener('click', resetQa);
      document.getElementById('btnProjResetQa').addEventListener('click', resetQa);
      document.getElementById('btnAddQaM').addEventListener('click', () => { qaSeconds += 60; updateTimersUI(); });
      document.getElementById('btnSubQaM').addEventListener('click', () => { qaSeconds = Math.max(0, qaSeconds - 60); updateTimersUI(); });

      // Respondent Draw
      document.getElementById('btnDrawRespondent').addEventListener('click', drawRespondent);
      document.getElementById('btnProjDrawAnswerer').addEventListener('click', drawRespondent);

      // Quick rate buttons
      document.getElementById('btnQuick2m').addEventListener('click', () => {
        state.isPresProp = true; state.presRate = 2; saveState(); resetPres();
        document.getElementById('btnQuick2m').className = 'px-2.5 py-1 rounded text-xs font-bold bg-indigo-600 text-white';
        document.getElementById('btnQuick1m').className = 'px-2.5 py-1 rounded text-xs font-semibold text-slate-400 hover:text-white';
      });
      document.getElementById('btnQuick1m').addEventListener('click', () => {
        state.isPresProp = true; state.presRate = 1; saveState(); resetPres();
        document.getElementById('btnQuick1m').className = 'px-2.5 py-1 rounded text-xs font-bold bg-indigo-600 text-white';
        document.getElementById('btnQuick2m').className = 'px-2.5 py-1 rounded text-xs font-semibold text-slate-400 hover:text-white';
      });
      document.getElementById('btnQuickQa5').addEventListener('click', () => {
        state.isQaProp = false; state.qaFixed = 5; saveState(); resetQa();
        document.getElementById('btnQuickQa5').className = 'px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white';
        document.getElementById('btnQuickQa3').className = 'px-2.5 py-1 rounded text-xs font-semibold text-slate-400 hover:text-white';
      });
      document.getElementById('btnQuickQa3').addEventListener('click', () => {
        state.isQaProp = false; state.qaFixed = 3; saveState(); resetQa();
        document.getElementById('btnQuickQa3').className = 'px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white';
        document.getElementById('btnQuickQa5').className = 'px-2.5 py-1 rounded text-xs font-semibold text-slate-400 hover:text-white';
      });

      document.getElementById('btnDrawGroup').addEventListener('click', drawNextGroup);
      document.getElementById('btnProjDraw').addEventListener('click', drawNextGroup);

      function doResetAll() {
        if (confirm("Reset all groups and timers? All groups will return to pending pool for a fresh session.")) {
          let all = parseRosterInput(state.rawGroupInput);
          if (!all || !all.length) {
            const seen = new Set();
            const combined = [...state.pendingGroups, ...state.presentedGroups, ...(state.currentGroup ? [state.currentGroup] : [])];
            all = [];
            for (const g of combined) {
              if (!seen.has(g.id)) {
                seen.add(g.id);
                all.push({ ...g, presentedAt: undefined });
              }
            }
          }
          state.pendingGroups = all.map(g => ({ ...g, presentedAt: undefined }));
          state.presentedGroups = [];
          state.currentGroup = null;
          state.currentRespondent = null;
          state.answeredMembers = [];
          saveState();
          syncUI();
        }
      }

      document.getElementById('btnResetSession').addEventListener('click', doResetAll);
      const projResetBtn = document.getElementById('btnProjResetAll');
      if (projResetBtn) projResetBtn.addEventListener('click', doResetAll);

      const projPoolToggleBtn = document.getElementById('btnProjPoolToggle');
      if (projPoolToggleBtn) {
        projPoolToggleBtn.addEventListener('click', () => {
          const container = document.getElementById('projPoolContainer');
          if (container) {
            container.classList.toggle('hidden');
          }
        });
      }

      document.getElementById('btnInitGroups').addEventListener('click', initializeGroupsFromInput);
      document.getElementById('btnLoadSample').addEventListener('click', () => {
        document.getElementById('inputCourseTitle').value = "DOTE5110 Statistical Analysis";
        document.getElementById('inputGroupList').value = DEFAULT_GOOGLE_SHEET_CSV;
        document.getElementById('selectPresRate').value = "2";
        document.getElementById('selectQaTime').value = "5";
        if (document.getElementById('inputPeerUrl')) {
          document.getElementById('inputPeerUrl').value = "https://forms.gle/bKtEYEEkvUy3F4mt6";
        }
      });

      document.getElementById('btnOpenPeerForm').addEventListener('click', () => {
        if (state.peerUrl) window.open(state.peerUrl, '_blank');
        else alert("Please set your Peer Evaluation Form URL in setup.");
      });

      document.getElementById('btnQrPeerForm').addEventListener('click', () => openQrModal('Student Peer Evaluation Form', state.peerUrl));
      document.getElementById('btnProjQrToggle').addEventListener('click', () => openQrModal('Student Peer Evaluation Form', state.peerUrl));
      document.getElementById('btnCloseQrModal').addEventListener('click', () => {
        document.getElementById('qrModal').classList.add('hidden');
      });
    });
  </script>
</body>
</html>`;
}
