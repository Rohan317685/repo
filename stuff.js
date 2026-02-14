var global_power_credits = parseFloat(localStorage.getItem('nuclear_credits')) || 0;
var my_unlocks = JSON.parse(localStorage.getItem('nuclear_unlocked')) || [];
var core_heat = parseFloat(localStorage.getItem('nuclear_heat')) || 350.0;
var cooling_val = parseFloat(localStorage.getItem('nuclear_cooling')) || 50.0;
var rod_settings = JSON.parse(localStorage.getItem('nuclear_rods')) || [20, 20, 20, 20];
var current_mw_output = 0;
var level_target = 50;
var is_reactor_live = true;
var last_frame_time = Date.now();
var stability_percent = 100;
var save_timer = 0;

function run_game_loop() {
    var right_now = Date.now();
    var delta = (right_now - last_frame_time) / 1000;
    last_frame_time = right_now;

    var combined_rods = 0;
    for (var i = 0; i < 4; i++) {
        combined_rods += rod_settings[i];
    }

    var heat_rising = 8.0 - ((combined_rods / 400) * 15);
    var cooling_power = (cooling_val / 100) * 6.5;

    core_heat = core_heat + (heat_rising - cooling_power);

    if (core_heat < 30) core_heat = 30;
    if (core_heat > 2500) core_heat = 2500;

    var math_p = (core_heat / 8) * (1 - (Math.abs(core_heat - 500) / 1000));
    current_mw_output = math_p < 0 ? 0 : math_p;

    var math_s = 100 - (Math.abs(core_heat - 400) / 10);
    stability_percent = math_s < 0 ? 0 : math_s;
    var is_matching = Math.abs(current_mw_output - level_target) < 6;

    var light = document.getElementById('match-light');
    if (light) {
        if (is_matching && stability_percent > 60) {
            if (light.innerText !== 'MATCH ACTIVE') {
                light.style.background = '#22c55e';
                light.style.boxShadow = '0 0 20px #22c55e';
                light.innerText = 'MATCH ACTIVE';
            }
            global_power_credits += 0.6 * delta * 10;
        } else {
            if (light.innerText !== 'WAITING...') {
                light.style.background = '#333';
                light.style.boxShadow = 'none';
                light.innerText = 'WAITING...';
            }
        }
    }

    save_timer++;
    if (save_timer > 60) {
        localStorage.setItem('nuclear_credits', global_power_credits);
        localStorage.setItem('nuclear_unlocked', JSON.stringify(my_unlocks));
        localStorage.setItem('nuclear_heat', core_heat);
        localStorage.setItem('nuclear_cooling', cooling_val);
        localStorage.setItem('nuclear_rods', JSON.stringify(rod_settings));
        save_timer = 0;
    }

    update_visuals();
    if (is_reactor_live) requestAnimationFrame(run_game_loop);
}

function updateRod(num, val) {
    rod_settings[num] = parseInt(val);
    localStorage.setItem('nuclear_rods', JSON.stringify(rod_settings));
}

function updateCooling(v) {
    cooling_val = parseInt(v);
    localStorage.setItem('nuclear_cooling', cooling_val);
}

function unlock_sector(id, price) {
    if (global_power_credits >= price) {
        global_power_credits -= price;
        my_unlocks.push(id);
        localStorage.setItem('nuclear_credits', global_power_credits);
        localStorage.setItem('nuclear_unlocked', JSON.stringify(my_unlocks));
        alert('Unlocked! check the sector.');
    } else {
        alert('not enough points yet. keep balancing the core!');
    }
}

function update_visuals() {

    var heats = document.querySelectorAll('.stat-heat-display, #stat-heat');
    heats.forEach(function (h) {
        h.innerText = core_heat.toFixed(1) + "°C";
    });

    var powers = document.querySelectorAll('.stat-power-display, #stat-power');
    powers.forEach(function (p) {
        p.innerText = current_mw_output.toFixed(1) + " MW";
    });


    var stabs = document.querySelectorAll('.stat-stability-display, #stat-stability');
    stabs.forEach(function (s) {
        s.innerText = stability_percent.toFixed(1) + "%";
    });

    var c = document.getElementById('game-credits');
    if (c) c.innerText = Math.floor(global_power_credits);

    var dot = document.getElementById('current-power-marker');
    if (dot) dot.style.left = Math.min(100, (current_mw_output / 150) * 100) + "%";

    for (var j = 0; j < 4; j++) {
        var r = document.getElementById('rod-v-' + j);
        if (r) r.style.transform = "translateY(" + rod_settings[j] + "%)";

        var slider = document.querySelector('input[oninput*="updateRod(' + j + '"]');
        if (slider && document.activeElement !== slider) {
            slider.value = rod_settings[j];
        }
    }

    var cooling_slider = document.querySelector('input[oninput*="updateCooling"]');
    if (cooling_slider && document.activeElement !== cooling_slider) {
        cooling_slider.value = cooling_val;
    }

    var clr = document.getElementById('core-glow');
    if (clr) {
        var opaque = 0.2 + (core_heat / 2500);
        var hhh = (core_heat > 900) ? 0 : 210;
        clr.style.background = "radial-gradient(circle, hsla(" + hhh + ", 100%, 50%, " + opaque + "), transparent)";
    }

    for (var k = 1; k <= 3; k++) {
        var b = document.getElementById('data-block-' + k);
        var bb = document.getElementById('unlock-btn-' + k);
        if (b && my_unlocks.includes(k)) {
            b.style.opacity = "1";
            if (bb) bb.style.display = "none";
            var cc = document.getElementById('data-content-' + k);
            if (cc) cc.style.display = "block";
        }
    }
}

function reset_target() {
    level_target = 15 + Math.random() * 90;
    var t_box = document.getElementById('target-box');
    if (t_box) t_box.style.left = (level_target / 120 * 100) + "%";
}

setInterval(reset_target, 15000);

window.onload = function () {
    run_game_loop();
    reset_target();
};

function getInfinitePointsNow() {
    global_power_credits = 999999;
    localStorage.setItem('nuclear_credits', global_power_credits);
    alert('Points adjusted for the admin session.');
    update_visuals();
}


