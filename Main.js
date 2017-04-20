// Toukiden 2 - Mitama Builder
// Disclaimer
// The data being used in this script was imported from https://docs.google.com/spreadsheets/d/1NOk8jt1VMAdOgdC9lhLytIE8lwSKnHBWW8-Ua5oNGXk/htmlview?sle=true#gid=542705028
// Thanks to the user ionenwks for posting the link (source: https://www.gamefaqs.com/boards/181163-toukiden-2/75159472/875891374)

console.clear();
var isDebug = false;
var maxBuildsShown = 50;
var gMitamas, gAbilities, gCombinations, gBoosts, gTooltips;
var builderArea, resultsArea, abilityArea, excludeArea;
var excludedMitamas;
var abilitySelectors;
var abilityID = 0;

setTimeout(function() {
  console.log("Initializing Abilities...");
  var benchStart = Date.now();
  initializeAbilities();
  var benchEnd = Date.now();
  console.log(gAbilities.length + " available Abilities. (" + ((benchEnd - benchStart) / 1000) + " sec)");

  console.log("Initializing Mitamas...");
  benchStart = Date.now();
  initializeMitamas();
  benchEnd = Date.now();
  console.log(gMitamas.length + " known Mitamas. (" + ((benchEnd - benchStart) / 1000) + " sec)");

  console.log("Initializing Boosts...");
  benchStart = Date.now();
  initializeBoosts();
  benchEnd = Date.now();
  console.log(gMitamas.length + " available Boosts. (" + ((benchEnd - benchStart) / 1000) + " sec)");

  console.log("Initializing Combinations...");
  benchStart = Date.now();
  initializeCombinations();
  benchEnd = Date.now();
  console.log(gCombinations.length + " possible Combinations. (" + ((benchEnd - benchStart) / 1000) + " sec)");

  console.log("Initializing Html...");
  benchStart = Date.now();
  initializeHtml();
  benchEnd = Date.now();
  console.log("Html initialized. (" + ((benchEnd - benchStart) / 1000) + " sec)");

  if (isDebug) {
    document.addAbilitySelector(gAbilities.getByName("Agility+ (Dual)"));
    document.addAbilitySelector(gAbilities.getByName("Verity"));
    document.addAbilitySelector(gAbilities.getByName("Vigor+ (Link)"));
    document.addAbilitySelector(gAbilities.getByName("Fervor"));
    document.addAbilitySelector(gAbilities.getByName("Heroes' Rally"));
    document.addAbilitySelector(gAbilities.getByName("Devastation"));
    document.addAbilitySelector(gAbilities.getByName("Swordsmanship"));

    document.refreshAbilitySelectors();
    document.refreshBuild();
  }

  document.getElementById("loader").remove();
}, 1000);

function setWorking(working, message) {
  if (working)
    $(resultsArea).text(message);

  var elements = document.getElementsByClassName("dww");
  for (var i = 0; i < elements.length; i++) {
    if (working)
      elements[i].setAttribute("disabled", "disabled");
    else
      elements[i].removeAttribute("disabled");
  }
}

function getHtmlForMitama(mitama, selectedAbi) {
  var rv = "<span class='mitama'>Type: " + mitama.category + "<br/>";
  rv += "<b>Name: " + mitama.name + "</b>";
  rv += " <a href=\"#\" onclick=\"document.exInCludeMitama('" + mitama.id + "', true);\">(exclude)</a>";
  rv += "<br/>";
  rv += "Location: " + mitama.location + "<br/>";
  rv += "Age: " + mitama.age + "<br/>";
  rv += "<span class='abilities'>";
  for (var i = 0; i < mitama.abilities.length; i++) {
    var ability = gAbilities.get(mitama.abilities[i]);
    var abilityName = ability.name;
    var abilityDesc = ability.description;
    var isSelected = false;

    // Unique ability comparison with just the name
    if (i === mitama.abilities.length - 1) {
      for (var j = 0; j < selectedAbi.length; j++) {
        var selName = selectedAbi[j].name;

        if (abilityName.indexOf(selName) >= 0) {
          isSelected = true;
          break;
        }
      }
    } else if (selectedAbi.indexOf(ability) >= 0)
      isSelected = true;

    if (isSelected) {
      selClass = " selected";
      addAbilityHtml = "";
    } else {
      selClass = "";
      addAbilityHtml = ' <a href="#" onclick="document.addAbilitySelector(' + ability.id + '); document.refreshAbilitySelectors(); document.refreshBuild();">(add to build)</a>';
    }

    rv += '<span class="ability' + selClass + '" title="' + abilityDesc + '">' + abilityName + addAbilityHtml + '</span>';
  }
  rv += "</span>";

  rv += "</span>";
  return rv;
}

function getHtmlForBoost(boost) {
  var rv = "<span class='boost'><b>Boost:</b> " + boost.name + " <b>Effect:</b> " + boost.boost + " <b>Restrictions:</b> ";
  rv += "<span class='restriction'>Restricted by";
  for (var i = 0; i < boost.restrictions.length; i++) {
    var restriction = boost.restrictions[i];
    rv += " " + restriction.category + " ";
    rv += (restriction.category === "mitama" ? gMitamas.get(restriction.restriction).name : restriction.restriction);
  }
  rv += "</span>";
  rv += "</span>";
  return rv;
}

document.refreshBuildAsynch = function() {
  var buildHtml = "";

  var selectedAbilities = [];
  for (var i = 0; i < abilitySelectors.length; i++) {
    var selectedAbility = abilitySelectors.getAbility(i);
    if (selectedAbility) {
      selectedAbilities.push(gAbilities.get(selectedAbility));
    }
  }

  if (selectedAbilities.length > 0) {
    buildHtml += "<span class='title'>Recommended Mitamas:</span>";
    for (var i = 0; i < gMitamas.length; i++) {
      var mitama = gMitamas[i];

      if (excludedMitamas.indexOf(mitama.id) >= 0)
        continue;

      var score = gMitamas.getScore(mitama, selectedAbilities);
      if (score >= 3) {

        buildHtml += "<span class='recommendation'>";

        buildHtml += getHtmlForMitama(mitama, selectedAbilities);

        buildHtml += "</span>";
      }
    }

    var builds = gCombinations.getForAbilities(selectedAbilities);

    buildHtml += "<span class='title'>Possible Builds (" + (builds.length >= maxBuildsShown ? maxBuildsShown : builds.length) + " of " + builds.length + "):</span>";
    if (builds.length > 0) {
      var abilityIDs = selectedAbilities.map(function(itm) {
        return itm.id;
      }).join();
      for (var i = 0; i < builds.length; i++) {
        if (i === maxBuildsShown) {
          break;
        } else {
          var build = builds[i];
          var mA = gMitamas.get(build.mitamas[0]);
          var mB = gMitamas.get(build.mitamas[1]);
          var mC = gMitamas.get(build.mitamas[2]);

          buildHtml += "<span class='build'>";

          buildHtml += getHtmlForMitama(mA, selectedAbilities);
          buildHtml += getHtmlForMitama(mB, selectedAbilities);
          buildHtml += getHtmlForMitama(mC, selectedAbilities);

          for (var j = 0; j < build.boosts.length; j++) {
            buildHtml += getHtmlForBoost(build.boosts[j]);
          }

          buildHtml += "<a style='float: right' href='#' class='exportBuild' onclick='document.exportBuild(" + build.mitamas[0] + ", " + build.mitamas[1] + ", " + build.mitamas[2] + ", [" + abilityIDs + "]);'>Export this build</a>";

          buildHtml += "</span>";
        }

      }
    } else buildHtml += "No builds available.";
  }

  $(resultsArea).text("");
  $(resultsArea).append(buildHtml);
}

document.refreshBuild = function() {
  setWorking(true, "Refreshing builds...");
  setTimeout(function() {
    document.refreshBuildAsynch();
    setWorking(false);
  }, 250);
}

document.clearSelection = function(id) {
  if (id) {
    abilitySelectors.clear(id);
  } else {
    for (var i = abilitySelectors.length - 1; i >= 0; i--) {
      abilitySelectors.clear(parseInt(abilitySelectors[i].id));
    }
  }

  document.refreshAbilitySelectors();
}

document.exInCludeMitama = function(id, exclude) {
  var intID = parseInt(id);
  if (exclude) {
    if (excludedMitamas.indexOf(intID) < 0) {
      excludedMitamas.push(intID);

      var mitama = gMitamas.get(intID);
      var elm = document.createElement("span");
      elm.id = "Excl" + intID;
      var eleHtml = "<a href=\"#\" onclick=\"document.exInCludeMitama('" + mitama.id + "', false);\">Include " + mitama.name + "</a>";
      elm.innerHTML = eleHtml;
      excludeArea.append(elm);
    }
  } else {
    var ind = excludedMitamas.indexOf(intID);
    if (ind >= 0) {
      excludedMitamas.splice(ind, 1);

      document.getElementById("Excl" + intID).remove();
    }
  }

  document.refreshBuild();
}

document.refreshAbilitySelectors = function() {
  var unusedCount = 0;
  for (var i = abilitySelectors.length - 1; i >= 0; i--) {
    var selectedability = abilitySelectors.getAbility(i);
    if (selectedability === undefined) {
      if (unusedCount > 0) {
        var elm = abilitySelectors[i];
        elm.remove();
        abilitySelectors.splice(i, 1);
      }

      unusedCount++;
    }
  }

  if (unusedCount === 0) {
    document.addAbilitySelector();
  }

  for (var i = 0; i < abilitySelectors.length; i++) {
    abilitySelectors[i].classList.remove("odd");
    abilitySelectors[i].classList.remove("even");

    if ((i + 1) % 2 === 0)
      abilitySelectors[i].classList.add("even");
    else
      abilitySelectors[i].classList.add("odd");
  }
}

document.addAbilitySelector = function(id) {
  abilityID++;
  var abilityEle = document.createElement("span");

  var eleHtml = "Ability <select class='dww' onchange='document.refreshAbilitySelectors(); document.refreshAbilitySelectors(); document.refreshBuild();'>";
  eleHtml += "<option value=''>None</option>";
  for (var i = 0; i < gAbilities.length; i++) {
    var ability = gAbilities[i];
    var selectedAttr = "";
    if (id && ability.id === id)
      selectedAttr = " selected=\"selected\"";

    eleHtml += "<option value=\"" + ability.id + "\"" + selectedAttr + ">" + ability.name + "</option>";
    if (ability === undefined || ability.id === undefined || ability.name === undefined) {
      debugger;
    }
  }

  eleHtml += "</select><input class='dww' type='button' value='clear' onclick='document.clearSelection(" + abilityID + "); document.refreshBuild();'/>";
  abilityEle.innerHTML = eleHtml;
  abilityEle.setAttribute("id", abilityID);
  abilitySelectors.push(abilityEle);
  abilityArea.append(abilityEle);
}

document.exportBuild = function(mA, mB, mC, selectedAbilities) {
  var exportString = mA + "|" + mB + "|" + mC + "|" + selectedAbilities.join(",");
  var elm = document.getElementById("importBox");
  elm.value = exportString;
  window.scrollTo(elm.offsetTop, 0);
  elm.focus();
}

document.importBuild = function() {
  document.clearSelection();
  var importString = document.getElementById("importBox").value;
  if (importString === "")
    alert("Please enter a valid import value first.");

  var importData = importString.split("|");
  if (importData.length !== 4) {
    alert("Invalid import value!");
    return;
  }

  importData[0] = parseInt(importData[0]);
  importData[1] = parseInt(importData[1]);
  importData[2] = parseInt(importData[2]);
  importData[0] = parseInt(importData[0]);

  var mA = importData[0];
  var mB = importData[1];
  var mC = importData[2];
  var abilities = importData[3].split(",");
  var selectedAbilities = [];
  for (var i = 0; i < abilities.length; i++) {
    abilities[i] = parseInt(abilities[i]);
    document.addAbilitySelector(abilities[i]);

    selectedAbilities.push(gAbilities.get(parseInt(abilities[i])));
  }

  var buildHtml = "<span class='title'>Saved Build:</span>";
  mA = gMitamas.get(mA);
  mB = gMitamas.get(mB);
  mC = gMitamas.get(mC);

  buildHtml += "<span class='build'>";

  buildHtml += getHtmlForMitama(mA, selectedAbilities);
  buildHtml += getHtmlForMitama(mB, selectedAbilities);
  buildHtml += getHtmlForMitama(mC, selectedAbilities);

  for (var i = 0; i < gCombinations.length; i++) {
    var comb = gCombinations[i];
    if (comb.mitamas.indexOf(mA.id) >= 0 && comb.mitamas.indexOf(mB.id) >= 0 && comb.mitamas.indexOf(mC.id) >= 0) {
      for (var j = 0; j < gCombinations[i].boosts.length; j++) {
        buildHtml += getHtmlForBoost(gCombinations[i].boosts[j]);
      }
    }
  }

  buildHtml += "<a style='float: right' href='#' class='exportBuild' onclick='document.exportBuild(" + mA.id + ", " + mB.id + ", " + mC.id + ", [" + abilities + "]);'>Export this build</a>";
  buildHtml += "</span>";

  $(resultsArea).text("");
  $(resultsArea).append(buildHtml);
}

function initializeHtml() {
  var clearSelectionEle, eleHtml;
  resultsArea = document.getElementById("results");
  builderArea = document.getElementById("builder");
  abilityArea = document.getElementById("builderAbilities");
  excludeArea = document.getElementById("excludedMitamas");
  abilitySelectors = [];
  abilitySelectors.getAbility = function(index) {
    var selAbility = abilitySelectors[index].childNodes[1].value;
    if (selAbility === "")
      return undefined;

    return parseInt(selAbility);
  };
  abilitySelectors.clear = function(ID) {
    for (var i = abilitySelectors.length - 1; i >= 0; i--) {
      if (parseInt(abilitySelectors[i].id) === ID)
        abilitySelectors[i].childNodes[1].value = "";
    }
  };
  excludedMitamas = [];

  document.addAbilitySelector();

  clearSelectionEle = document.createElement("span");
  clearSelectionEle.innerHTML = "<input class='dww' style='float: right; clear: both;' type='button' value='clear all' onclick='document.clearSelection(); document.refreshBuild();'/>";
  builderArea.append(clearSelectionEle);
}

function initializeAbilities() {
  gAbilities = [];
  gAbilities.getByName = function(name) {
    name = name.trim();
    for (var i = 0; i < gAbilities.length; i++) {
      var ability = gAbilities[i];
      if (ability.name === name)
        return ability.id;
    };
  };
  gAbilities.get = function(id) {
    for (var i = 0; i < gAbilities.length; i++)
      if (gAbilities[i].id === id)
        return gAbilities[i];

    return undefined;
  };

  // Init entries
  gAbilities.push({
    id: 0,
    name: "'Demon' According Shi demon (Your Damage and Defenses Up during any CON Skill)",
    description: "when the Kuoni is embodied, increased damage, damage received is reduced."
  });
  gAbilities.push({
    id: 1,
    name: "A Cup of Sake (Breaker+ (Amplify) + Breaker+ (Sublime))",
    description: "to increase the effect the amount of armor split, in Yoroiwari, effect of ability is likely to rise."
  });
  gAbilities.push({
    id: 2,
    name: "A Foreign Presence (All Skills+ (Purify))",
    description: "When you clean the 'demon' and site at the demon exorcism, rarely Tamafuri use number of times to recover."
  });
  gAbilities.push({
    id: 3,
    name: "A General's Character (Fortuity (Reduce) + Fortuity+ (Amplify))",
    description: "to reduce the use interval of Kitamashi. Effect of Kitamashi is raised, but rarely physical strength of itself is reduced, become sealed state."
  });
  gAbilities.push({
    id: 4,
    name: "A Gifted Writer (Stupor (Increase) + Stealth)",
    description: "the number of uses of immobility gold strapping is increased, less likely a target of 'demon'."
  });
  gAbilities.push({
    id: 5,
    name: "A Great Samurai (Universal SPD Master (Special) + Fitness)",
    description: "an increase in damage in the special technique, attack power, defense force, the maximum value of the physical strength to rise."
  });
  gAbilities.push({
    id: 6,
    name: "A Matchless Archer (Surveyance + Dissection (Focus))",
    description: "Homing Arrows deal more damage and can select a wider targeting area. Also you will Recover Focus when breaking Body Parts."
  });
  gAbilities.push({
    id: 7,
    name: "A Monetary Economy (Exploit (Destroy))",
    description: "When you destroy the state or defeat the 'demon' in the abnormal region, rarely Tamafuri use number of times to recover."
  });
  gAbilities.push({
    id: 8,
    name: "A Paragon of Might (Tempered Blade + Gouge+ (Nimble))",
    description: "Residual double suicide, attack speed is increased. Furthermore sword wound is likely to be deep, attack after the water stop is always deeply."
  });
  gAbilities.push({
    id: 9,
    name: "A Stone's Throw (Energy+ (Quicken) + Elemental)",
    description: "Reduces Skill cooldown times when using Energy, and increases Attack strength for elemental attacks."
  });
  gAbilities.push({
    id: 10,
    name: "A symbol of burning love (Oni Eater+ (Range))",
    description: "When you applied to the weapon element of the captured Great attribute in the demon Eating, to grant some of the effects to allies within range."
  });
  gAbilities.push({
    id: 11,
    name: "A White Fox's Love (Charity + Devotion)",
    description: "A united front gauge increased amount is increased.  Also attack force is greatly increased, but the energy recovery rate decreases"
  });
  gAbilities.push({
    id: 12,
    name: "A Wife's Assistance (Majesty + Brandish)",
    description: "Precision Strike chance and Weapon Gauge gains are increased while your Health is at maximum."
  });
  gAbilities.push({
    id: 13,
    name: "A Youthful Decision (Exploit (Absorb) + Ebullience)",
    description: "Recover Stamina based on damage dealt when attacking an Oni suffering from a status ailment. Additionally Damage is increased while Focus is at Maximum."
  });
  gAbilities.push({
    id: 14,
    name: "Ablution (Increase)",
    description: "Increases the number of Ablutions you can carry"
  });
  gAbilities.push({
    id: 15,
    name: "Ablution (Reduce)",
    description: "Reduce the cooldown on Ablution."
  });
  gAbilities.push({
    id: 16,
    name: "Ablution (Time)",
    description: "Increases duration of Ablution."
  });
  gAbilities.push({
    id: 17,
    name: "Ablution+ (Extend)",
    description: "Extends the amount of time parts are affected by ablution"
  });
  gAbilities.push({
    id: 18,
    name: "Ablution+ (Nimble)",
    description: "Increases Attack Speed while Ablution is active."
  });
  gAbilities.push({
    id: 19,
    name: "Ablution+ (Potency)",
    description: "Breaking parts affect by ablution will restore health and focus"
  });
  gAbilities.push({
    id: 20,
    name: "Ablution+ (Quicken)",
    description: "Reduce the cooldown on your Weapon Mitama abilities when you destroy a Body Part affected by Ablution."
  });
  gAbilities.push({
    id: 21,
    name: "Ablution+ (Restore)",
    description: "Breaking parts affected by ablution may restore Ablution stocks"
  });
  gAbilities.push({
    id: 22,
    name: "Ablution+ (Rigid)",
    description: "Decreases the chance of being knocked down while Ablution is active."
  });
  gAbilities.push({
    id: 23,
    name: "Ablution+ (Wraith)",
    description: "Increase the Weapon Gauge when you destroy a Body Part affected by Ablution."
  });
  gAbilities.push({
    id: 24,
    name: "Abyss",
    description: "Increases damage of Naginata's Eventide"
  });
  gAbilities.push({
    id: 25,
    name: "Accepting the Times (Purification (Assist))",
    description: "Refills the Unity Gauge after purifying an Oni or body part with the Ritual of Purification."
  });
  gAbilities.push({
    id: 26,
    name: "Acrobat (Reduce)",
    description: "Reduce the cooldown of Acrobat."
  });
  gAbilities.push({
    id: 27,
    name: "Acrobat (Time)",
    description: "Increases the duration of Acrobat ability."
  });
  gAbilities.push({
    id: 28,
    name: "Acrobat+ (Aegis)",
    description: "Regeneration of the red part of your Health Gauge is increased while Acrobat ability is active."
  });
  gAbilities.push({
    id: 29,
    name: "Acrobat+ (Bonus)",
    description: "Focus Recovery is increased while Acrobat ability is active."
  });
  gAbilities.push({
    id: 30,
    name: "Acrobat+ (Evade)",
    description: "While Acrobat ability is active. Focus cost of Dodge is reduced and Invulerability time is increased."
  });
  gAbilities.push({
    id: 31,
    name: "Acrobat+ (Swift)",
    description: "Movement Speed is increased while Acrobat ability is active."
  });
  gAbilities.push({
    id: 32,
    name: "Actions Speark Louder (Sacrifice+ (Minimize) + Sacrifice+ (Amplify))",
    description: "in at the risk of life Kyogi, physical strength decrease the amount is reduced, and the effect the amount of ability is increased."
  });
  gAbilities.push({
    id: 33,
    name: "Acupuncture",
    description: "During the bitter-free injection, energy recovery rate is increased"
  });
  gAbilities.push({
    id: 34,
    name: "Admirable Dedication (Defense Up to all nearby including self, Chance)",
    description: "Increases Defense of you and all nearby Allies. Also enables you to receive no damage from enemy attacks on occasion."
  });
  gAbilities.push({
    id: 35,
    name: "Aerial Assault",
    description: "Aerial time with the Chain & Sickle uses less focus. Hit and Away no longer uses Focus."
  });
  gAbilities.push({
    id: 36,
    name: "Aerial Focus",
    description: "Makes it easier to achieve a precision strike while jumping."
  });
  gAbilities.push({
    id: 37,
    name: "Affliction",
    description: "Increases status infliction rate."
  });
  gAbilities.push({
    id: 38,
    name: "Agility (Increase)",
    description: "Number of uses of Agility is increased."
  });
  gAbilities.push({
    id: 39,
    name: "Agility (Reduce)",
    description: "Reduce the cooldown of Agility."
  });
  gAbilities.push({
    id: 40,
    name: "Agility+ (Bonus)",
    description: "Focus recovery is increased while Agility is active."
  });
  gAbilities.push({
    id: 41,
    name: "Agility+ (Dual)",
    description: "Dodge two attacks with Agility before the ability expires instead of just one, however the cooldown of Agility is doubled."
  });
  gAbilities.push({
    id: 42,
    name: "Agility+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Speed Mitama equipped to your Weapon there is a chance to gain an extra charge of Agility."
  });
  gAbilities.push({
    id: 43,
    name: "Agility+ (Quicken)",
    description: "Cooldowns of your Weapon Mitama abilities are reduced when Agility expires."
  });
  gAbilities.push({
    id: 44,
    name: "Agility+ (Sneak)",
    description: "Oni are less likely to focus their attention on you while Agility is active."
  });
  gAbilities.push({
    id: 45,
    name: "Agitation",
    description: "Increases the attack speed of a Flurry"
  });
  gAbilities.push({
    id: 46,
    name: "Alertness",
    description: "Protects you from the Sleep ailment."
  });
  gAbilities.push({
    id: 47,
    name: "Altruism (Increase)",
    description: "Number of uses of Altruism is increased."
  });
  gAbilities.push({
    id: 48,
    name: "Altruism (Reduce)",
    description: "Reduce the cooldown on Altruism."
  });
  gAbilities.push({
    id: 49,
    name: "Altruism (Time)",
    description: "Increases duration of Altruism"
  });
  gAbilities.push({
    id: 50,
    name: "Altruism+ (Accuracy)",
    description: "Increased chance of Precision Strikes while Altruism is active."
  });
  gAbilities.push({
    id: 51,
    name: "Altruism+ (Amplify)",
    description: "Increases the effects of Altruism"
  });
  gAbilities.push({
    id: 52,
    name: "Altruism+ (Attributes)",
    description: "Increases Elemental Damage when in Altruism's effect"
  });
  gAbilities.push({
    id: 53,
    name: "Altruism+ (Destroy)",
    description: "Breaking a Body Part while a Support Mitama is equipped to your Weapon has a chance to give an extra charge of Altruism"
  });
  gAbilities.push({
    id: 54,
    name: "Altruism+ (Nimble)",
    description: "Increases attack speed when in Altruism's effect"
  });
  gAbilities.push({
    id: 55,
    name: "Altruism+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Support Mitama equipped to your Weapon there is a chance to gain an extra charge of Altruism."
  });
  gAbilities.push({
    id: 56,
    name: "Altruism+ (Qinggong)",
    description: "Focus Consumption is reduced while Altruism is active."
  });
  gAbilities.push({
    id: 57,
    name: "Altruism+ (Surprise)",
    description: "Increases Ailment chance when in Altruism's effect"
  });
  gAbilities.push({
    id: 58,
    name: "Altruism+ (Wraith)",
    description: "Weapong gauge amount gained increases when Altruism is in effect"
  });
  gAbilities.push({
    id: 59,
    name: "Amashogun of Kamakura (Stealth + Universal DCT Master (Assault))",
    description: "Decreased chance of gaining enemies attention. Also when attacking from behind your Precision Strike chance is increased."
  });
  gAbilities.push({
    id: 60,
    name: "An Enchanting Dancer (Restoration + Divinity)",
    description: "their own physical strength and vigor of the recovery effect is increased."
  });
  gAbilities.push({
    id: 61,
    name: "Anchor that Mitodoke the demise (Always Trigger Injured abilities but Max HP greatly lowered)",
    description: "the maximum value of physical strength is greatly reduced, but always a dying treatment."
  });
  gAbilities.push({
    id: 62,
    name: "Ancient Oracle (Lifesaver + Oni Eater+ (Wraith))",
    description: "When you rescue an ally, the strength of the opponent larger amount recovered, when the grant element of the captured Great attributes in the demon Eating a weapon, weapon gauge increases."
  });
  gAbilities.push({
    id: 63,
    name: "Antidote",
    description: "Protects you from the Poison ailment."
  });
  gAbilities.push({
    id: 64,
    name: "Aoba whistle (Stamina + Diffusion+ (Reflect))",
    description: "Increases Maximum Health. Also in effect of Diffusion, give a portion of the received damage to the opponent."
  });
  gAbilities.push({
    id: 65,
    name: "Apothecary (Reduce)",
    description: "Reduce the cooldown on Apothecary ability."
  });
  gAbilities.push({
    id: 66,
    name: "Apothecary+ (Bonus)",
    description: "Restore Focus when you activate Apothecary ability."
  });
  gAbilities.push({
    id: 67,
    name: "Apothecary+ (Nimble)",
    description: "Increases Attack Speed while Apothecary ability is active."
  });
  gAbilities.push({
    id: 68,
    name: "Apothecary+ (Quicken)",
    description: "Reduces cooldowns of all skills when Apothecary ability activates"
  });
  gAbilities.push({
    id: 69,
    name: "Apothecary+ (Surprise)",
    description: "When Apothecary is active, state abnormal attack power is increased."
  });
  gAbilities.push({
    id: 70,
    name: "Application",
    description: "Maximum Focus is increased."
  });
  gAbilities.push({
    id: 71,
    name: "Arms of Steel",
    description: "Increases duration of Club's Hyperpowered state"
  });
  gAbilities.push({
    id: 72,
    name: "Arrogant Behavior (Exploit (Leech) + Exuberance)",
    description: "Recover Health based on damage dealt when attacking an Oni suffering from a status ailment. Damage is also increased while your Health is at maximum."
  });
  gAbilities.push({
    id: 73,
    name: "Art of Ninjustsu (Oni Tangle+ (Qinggong) + Fervor)",
    description: "While materialize Oninote, energy consumption is reduced. In addition when the satisfaction occurs, energy is recovered."
  });
  gAbilities.push({
    id: 74,
    name: "Asahi Sakigake (Oni Burial+ (Extend))",
    description: "When kisou was successful, to prolong the effect time of Tamafuri."
  });
  gAbilities.push({
    id: 75,
    name: "Assassin's Blade (Chain + Precision strikes may Insta-kill small oni)",
    description: "Mitama abilities can be activated during attacks. Also Precision Strikes have a chance to instantly defeat Small Oni."
  });
  gAbilities.push({
    id: 76,
    name: "Assertion",
    description: "Protects you from the Seal ailment."
  });
  gAbilities.push({
    id: 77,
    name: "ATK Master (Aegis)",
    description: "Increases the recovery of the red part of the Health gauge when in Purification Stance & having an ATK Mitama in your Weapon slot"
  });
  gAbilities.push({
    id: 78,
    name: "ATK Master (Amplify)",
    description: "When ATK mitama is in Weapon slot, Furthur increases Focus recovery rate when in Purification Stance"
  });
  gAbilities.push({
    id: 79,
    name: "ATK Master (Maintain)",
    description: "When ATK Mitama is in Weapon slot, Purification stance will slow down duration of active skills"
  });
  gAbilities.push({
    id: 80,
    name: "Attack Up",
    description: "Increases Attack."
  });
  gAbilities.push({
    id: 81,
    name: "Auto-therapy (Reduce)",
    description: "Reduce the cooldown of Auto-therapy ability."
  });
  gAbilities.push({
    id: 82,
    name: "Auto-therapy+ (Amity)",
    description: "Gradually restores health when Auto-therapy is active"
  });
  gAbilities.push({
    id: 83,
    name: "Auto-therapy+ (Impulse)",
    description: "Triggers Auto-therapy even when you defeat an Oni or destroy a body part."
  });
  gAbilities.push({
    id: 84,
    name: "Auto-therapy+ (Quicken)",
    description: "Reduces Skill cooldown times after using Auto-therapy."
  });
  gAbilities.push({
    id: 85,
    name: "Auto-therapy+ (React)",
    description: "Auto-therapy may trigger upon taking damage"
  });
  gAbilities.push({
    id: 86,
    name: "Auto-therapy+ (Relief)",
    description: "Triggers Auto-therapy for nearby allies that are near death."
  });
  gAbilities.push({
    id: 87,
    name: "Barrier (Increase)",
    description: "Increases the number of times you can use Barrier."
  });
  gAbilities.push({
    id: 88,
    name: "Barrier (Reduce)",
    description: "Reduces the cooldown time on Barrier"
  });
  gAbilities.push({
    id: 89,
    name: "Barrier (Time)",
    description: "Extends the duration of Barrier."
  });
  gAbilities.push({
    id: 90,
    name: "Barrier+ (Awe)",
    description: "Most Oni are knocked down upon contact with you while Barrier is active."
  });
  gAbilities.push({
    id: 91,
    name: "Barrier+ (Brawn)",
    description: "Gives you the advantage in close-quarter shoves when using Barrier"
  });
  gAbilities.push({
    id: 92,
    name: "Barrier+ (Link)",
    description: "Adds the effects of Shield and Taunt when using Barrier."
  });
  gAbilities.push({
    id: 93,
    name: "Barrier+ (Shred)",
    description: "While Barrier is active breaking a Body Part by a Destroyer will increase the duration of Barrier."
  });
  gAbilities.push({
    id: 94,
    name: "Barrier+ (Wraith)",
    description: "Increases the amount the Weapon Gauge rises by when using Barrier."
  });
  gAbilities.push({
    id: 95,
    name: "Basis of Prosperity (Bastion+ (Link) + Striker+ (Amplify))",
    description: "when using the Olympics Gongen, given the effect of Mamoru species s, an effective amount of Mamoru species s to rise."
  });
  gAbilities.push({
    id: 96,
    name: "Bastion (Increase)",
    description: "Increases stock count of  Bastion skill"
  });
  gAbilities.push({
    id: 97,
    name: "Bastion (Reduce)",
    description: "Reduces the cooldown time on CON's Circle ability."
  });
  gAbilities.push({
    id: 98,
    name: "Bastion (Time)",
    description: "Increases duration of  Bastion skill"
  });
  gAbilities.push({
    id: 99,
    name: "Bastion+ (Attract)",
    description: "Attracts oni when  Bastion is in effect"
  });
  gAbilities.push({
    id: 100,
    name: "Bastion+ (Attributes)",
    description: "Great attribute attack force of reification has been Kuoni rises in the Olympics Gongen"
  });
  gAbilities.push({
    id: 101,
    name: "Bastion+ (Destroy)",
    description: "Breaking a Body Part while a CON Mitama is equipped to your Weapon has a chance to give an extra charge of  Bastion"
  });
  gAbilities.push({
    id: 102,
    name: "Bastion+ (Geopulse)",
    description: "When the effect of the Olympics Gongen has expired, Kuoni is to generate a Geopulse."
  });
  gAbilities.push({
    id: 103,
    name: "Bastion+ (Nimble)",
    description: "Of reification has been Kuoni in the Olympics Gongen attack speed is increased."
  });
  gAbilities.push({
    id: 104,
    name: "Bastion+ (Teleport)",
    description: "Swap positions with the Kuoni by going into purification stance when  Bastion is active"
  });
  gAbilities.push({
    id: 105,
    name: "Beauty and Wisdom (Piety + Purification (Quicken))",
    description: "Strengthens the effect of your Ritual of Purification. Also reduce the cooldown on Weapon Mitama abilities when Purifying Oni or their Body Parts."
  });
  gAbilities.push({
    id: 106,
    name: "Before and After (Decoy+ (Bolster))",
    description: "Katashiro in the s, damage is increased."
  });
  gAbilities.push({
    id: 107,
    name: "Benevolence of the mother (Charity + Lifesaver)",
    description: "Unity Gauge gains are increased. In addition when you rescue an ally they revive with more Health."
  });
  gAbilities.push({
    id: 108,
    name: "Benevolent Leader (Divinity + Conviction)",
    description: "Recovery speed of the red part of the Health gauge is increased. Also you cannot be killed in a single blow while at Full Health."
  });
  gAbilities.push({
    id: 109,
    name: "Bitter words (Puncture (Reduce) + Puncture+ (Poison))",
    description: "Reduce the cooldown on Puncture. AlsoFurther weakened site in secret needle to attack, giving the additional damage of poison."
  });
  gAbilities.push({
    id: 110,
    name: "Blue Demon Form (Attacks restore HP but Max HP is lowered.)",
    description: "The maximum value of physical strength is reduced, but to recover the strength in response to the damage done."
  });
  gAbilities.push({
    id: 111,
    name: "Born Shogun (Brandish + Heroe's Rally)",
    description: "When physical strength is maximum, satisfaction is more likely to occur, when the satisfaction has occurred, to shorten the Tamafuri use interval."
  });
  gAbilities.push({
    id: 112,
    name: "Boutiful Elegance (Dissection (Assist))",
    description: "shed demon torn, united front gauge increases."
  });
  gAbilities.push({
    id: 113,
    name: "Brandish",
    description: "Increased chance for precision strikes while your Health is at maximum."
  });
  gAbilities.push({
    id: 114,
    name: "Breaker (Increase)",
    description: "Increases the number of Breakers you can carry"
  });
  gAbilities.push({
    id: 115,
    name: "Breaker (Reduce)",
    description: "Reduces the cooldown on Breaker"
  });
  gAbilities.push({
    id: 116,
    name: "Breaker (Time)",
    description: "Extends the duration of Breaker"
  });
  gAbilities.push({
    id: 117,
    name: "Breaker+ (Amplify)",
    description: "Further makes it easier to break parts or the Outer Shell of Oni while Breaker is active."
  });
  gAbilities.push({
    id: 118,
    name: "Breaker+ (Havoc)",
    description: "Breaking a part with Breaker active will extend its duration"
  });
  gAbilities.push({
    id: 119,
    name: "Breaker+ (Link)",
    description: "Adds the affects of Ablution when activating Breaker."
  });
  gAbilities.push({
    id: 120,
    name: "Breaker+ (Purify)",
    description: "Purifying body parts may restore a Breaker stock"
  });
  gAbilities.push({
    id: 121,
    name: "Breaker+ (Sublime)",
    description: "Makes it easier to increase the effectivness of your abilities when using Breaker"
  });
  gAbilities.push({
    id: 122,
    name: "Breakthrough",
    description: "Increases the damage you inflict for Dual Knives' Leaping Attack and Double Stab"
  });
  gAbilities.push({
    id: 123,
    name: "Brilliant Planner (Oni Eater+ (Attributes) + Oni Eater+ (Bulwark))",
    description: "When applied to the 'demon' of the elements of the Great attributes captured by the demon Eating, increased damage, attribute resistance value is further reduced."
  });
  gAbilities.push({
    id: 124,
    name: "Burning Love (Oni Burial+ (Health) + Brandish)",
    description: "When a successful kisou, physical strength is restored, when the strength is maximum, satisfaction is likely to occur."
  });
  gAbilities.push({
    id: 125,
    name: "Butterfly Dance",
    description: "Reduces Focus usage of Parry."
  });
  gAbilities.push({
    id: 126,
    name: "Butterfly's Scales (Dissection (Health) + Majesty)",
    description: "If you destroy or site defeat the 'demon', physical strength is restored. In addition, when physical strength is the maximum, weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 127,
    name: "Calm Moonlight (Panacea+ (Purify))",
    description: "When the weapon Spirit is 'healing', and to purify the 'demon' and site at the demon exorcism, the number of uses of rare strange Wakamizu is restored."
  });
  gAbilities.push({
    id: 128,
    name: "Carnage (Increase)",
    description: "Number of uses of Carnage is increased."
  });
  gAbilities.push({
    id: 129,
    name: "Carnage (Reduce)",
    description: "Reduces the cooldown time of Carnage."
  });
  gAbilities.push({
    id: 130,
    name: "Carnage (Time)",
    description: "Increases the duration of Carnage"
  });
  gAbilities.push({
    id: 131,
    name: "Carnage+ (Link)",
    description: "Adds the effects of Might and Leech when activating Carnage."
  });
  gAbilities.push({
    id: 132,
    name: "Carnage+ (Martyr)",
    description: "Using Carnage drains your health but increases damage except when near death."
  });
  gAbilities.push({
    id: 133,
    name: "Carnage+ (Quicken)",
    description: "Shorten the cooldown of your Weapon Mitama abilities by Defeating Oni or breaking Body Parts while Carnage is active."
  });
  gAbilities.push({
    id: 134,
    name: "Carnage+ (Shred)",
    description: "While Carnage is active, Connecting a Destroyer will extend the duration of Carnage."
  });
  gAbilities.push({
    id: 135,
    name: "Chain",
    description: "Mitama abilities can be activated during attacks."
  });
  gAbilities.push({
    id: 136,
    name: "Chance",
    description: "Enables you to receive no damage from enemy attacks on occasion."
  });
  gAbilities.push({
    id: 137,
    name: "Charity",
    description: "Unity Gauge gains are increased."
  });
  gAbilities.push({
    id: 138,
    name: "CON Master (Earth)",
    description: "When you have a CON Mitama in your Weapon Slot. Physical and Elemental Defense up while your Kuoni are attuned to Earth"
  });
  gAbilities.push({
    id: 139,
    name: "CON Master (Fire)",
    description: "When you have a CON Mitama in your Weapon Slot. Attack and Precision up while your Kuoni are attuned to Fire."
  });
  gAbilities.push({
    id: 140,
    name: "CON Master (Sky)",
    description: "When you have a CON Mitama in your Weapon Slot. Elemental Attack up while your Kuoni are attuned to Heaven"
  });
  gAbilities.push({
    id: 141,
    name: "CON Master (Water)",
    description: "Gradually restores Health when summoning a Water pet while using a CON Mitama for your weapon."
  });
  gAbilities.push({
    id: 142,
    name: "CON Master (Wind)",
    description: "When you have a CON Mitama in your Weapon Slot. Movment and Attack Speed up while your Kuoni are attuned to Wind"
  });
  gAbilities.push({
    id: 143,
    name: "Concentration",
    description: "Increases the damage you inflict when executing a Spear's Hawk Swoop"
  });
  gAbilities.push({
    id: 144,
    name: "Conduction",
    description: "Recovers Focus after a Cursed Arrow is exploded"
  });
  gAbilities.push({
    id: 145,
    name: "Confrontation",
    description: "Extends the period of invulnerability during a Club's Stop-Thrust"
  });
  gAbilities.push({
    id: 146,
    name: "Consistently Wild (Providence (Reduce) + Fervor)",
    description: "to reduce the use interval of luck blessing, when the satisfaction occurs, energy is recovered."
  });
  gAbilities.push({
    id: 147,
    name: "Contagion (Reduce)",
    description: "Reduce the cooldown on Contagion ability."
  });
  gAbilities.push({
    id: 148,
    name: "Contagion (Time)",
    description: "Extends the duration of Contagion ability."
  });
  gAbilities.push({
    id: 149,
    name: "Contagion+ (Absorb)",
    description: "When you use Contagion, Energy of allies is restored within range, including your own"
  });
  gAbilities.push({
    id: 150,
    name: "Contagion+ (Accuracy)",
    description: "Increases precision strike chance while Contagion ability is active."
  });
  gAbilities.push({
    id: 151,
    name: "Contagion+ (Amplify)",
    description: "Damage dealt by Contagion ability is increased."
  });
  gAbilities.push({
    id: 152,
    name: "Contagion+ (Ardor)",
    description: "Increases precision and adds Fervor effect when skill is in effect"
  });
  gAbilities.push({
    id: 153,
    name: "Contagion+ (Quicken)",
    description: "Shortens cooldowns when attacking Oni affected by Contagion"
  });
  gAbilities.push({
    id: 154,
    name: "Convergence",
    description: "Increases damage of Single Arrows. Damage further increased by string tension"
  });
  gAbilities.push({
    id: 155,
    name: "CON Master (Extend)",
    description: "When you have a CON Mitama in your Weapon Slot, Effective amount of ability is increased."
  });
  gAbilities.push({
    id: 156,
    name: "Cool Desciveness (Stone Wall + Brandish)",
    description: "When physical strength is the maximum, receive damage is reduced, satisfaction is likely to occur."
  });
  gAbilities.push({
    id: 157,
    name: "Criminal Investigator (Exigency + Desperation)",
    description: "Movement Speed and Damage are increased while your Health is Low."
  });
  gAbilities.push({
    id: 158,
    name: "Curse (Reduce)",
    description: "Reduce the cooldown of Curse ability."
  });
  gAbilities.push({
    id: 159,
    name: "Curse (Time)",
    description: "Increases the duration of Curse ability."
  });
  gAbilities.push({
    id: 160,
    name: "Curse+ (Assist)",
    description: "Connecting a Destroyer suffering from Curse will fill some of the Unity gauge"
  });
  gAbilities.push({
    id: 161,
    name: "Curse+ (Attract)",
    description: "To Noroikin, draw the demon to give effect."
  });
  gAbilities.push({
    id: 162,
    name: "Curse+ (Poison)",
    description: "Small demon suffering Noroikin reduce the physical strength."
  });
  gAbilities.push({
    id: 163,
    name: "Curse+ (Restrain)",
    description: "Effect the amount of Noroikin rises, further inhibit the movement of the demon."
  });
  gAbilities.push({
    id: 164,
    name: "Curse+ (Weaken)",
    description: "Target suffering from Curse will take more damage"
  });
  gAbilities.push({
    id: 165,
    name: "Curse+ (Wraith)",
    description: "Shed attack to demon rests on the Noroikin, Weapon gauge increased amount is increased"
  });
  gAbilities.push({
    id: 166,
    name: "Dancing Grace",
    description: "Makes it easier to enter a Hyperskilled state."
  });
  gAbilities.push({
    id: 167,
    name: "Dawn of Spring (Lifesaver + Protection of Heroes)",
    description: "When you rescue an ally they revive with more Health. Also Occasionally when activating a Weapon Mitama ability a usage will not be expended."
  });
  gAbilities.push({
    id: 168,
    name: "Dawn of the Warring States (Insight + DCT Master (Wraith))",
    description: "an increase in damage in the demon torn, and hit the attack from behind the 'demon', weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 169,
    name: "DCT Master (Assault)",
    description: "Furthur increases precision when attacking from behind when having a DCT mitama in weapons slot"
  });
  gAbilities.push({
    id: 170,
    name: "DCT Master (Surprise)",
    description: "Increases chances of inflicting Ailments when attacking from behind and having a DCT mitama in weapons slot"
  });
  gAbilities.push({
    id: 171,
    name: "DCT Master (Wraith)",
    description: "Increases the amount the Weapon gauge rises when attacking from behind and having a DCT mitama in weapons slot"
  });
  gAbilities.push({
    id: 172,
    name: "Deadly Beauty (Parries increase Hyperskilled State, Damage Up when max)",
    description: "when a successful per pass, rises and Tsuremai state, when Tsuremai state of maximum, damage is increased."
  });
  gAbilities.push({
    id: 173,
    name: "Decoy (Reduce)",
    description: "Reduces the Skill cooldown time for Summon Decoy."
  });
  gAbilities.push({
    id: 174,
    name: "Decoy+ (Attributes)",
    description: "Great attribute attack force of reification has been Kuoni rises in Katashiro s"
  });
  gAbilities.push({
    id: 175,
    name: "Decoy+ (Lure)",
    description: "Reification has been Kuoni in Katashiro ed, it is easily targeted to the demon."
  });
  gAbilities.push({
    id: 176,
    name: "Decoy+ (Potency)",
    description: "Restores the Health and Focus of you and your nearby allies when the pet you summoned with Summon Decoy explodes."
  });
  gAbilities.push({
    id: 177,
    name: "Decoy+ (Teleport)",
    description: "During Katashiro s, when the demon exorcism, Misao demon is moved close to its own"
  });
  gAbilities.push({
    id: 178,
    name: "Decoy+ (Sanctity)",
    description: "Instantly purifies nearby body parts when  Decoy detonates"
  });
  gAbilities.push({
    id: 179,
    name: "DEF Master (Augment)",
    description: "Increases the amount the Defense Gauge rises by during the Ritual of Purification while using a DEF Mitama for your weapon."
  });
  gAbilities.push({
    id: 180,
    name: "DEF Master (Protect)",
    description: "When having a DEF Mitama on your weapon, Defense gauge fills naturally"
  });
  gAbilities.push({
    id: 181,
    name: "DEF Master (Purify)",
    description: "Purifying body parts will add Defense gauge (DEF style)"
  });
  gAbilities.push({
    id: 182,
    name: "DEF Master (Resist)",
    description: "When having a DEF Mitama on your weapon, you are immune to all ailments"
  });
  gAbilities.push({
    id: 183,
    name: "DEF Master (Rigid)",
    description: "When having a DEF Mitama on your weapon, resist being knocked back when in Purification stance"
  });
  gAbilities.push({
    id: 184,
    name: "DEF Master (Valiant)",
    description: "When having a DEF Mitama on your weapon, Increases the Max Size of the Defense Gauge"
  });
  gAbilities.push({
    id: 185,
    name: "Defier of Mongols (Taking Damage restores Focus)",
    description: "When damaged, energy is restored"
  });
  gAbilities.push({
    id: 186,
    name: "Demon Avenger (Swordsmanship + Fervor)",
    description: "Precision Strikes increase your Weapon Gauge and Restore Focus."
  });
  gAbilities.push({
    id: 187,
    name: "Demon dismantling Shinsho (Restoration + Dissection (Focus))",
    description: "Energy recovery speed is increased, and to destroy or site defeat the demon, energy is restored"
  });
  gAbilities.push({
    id: 188,
    name: "Dengyō Daishi (Recovery+ (Amplify) + Protection of Heroes)",
    description: "Increases the effect of Recovery. When using Skills, rarely the number of uses is not reduced."
  });
  gAbilities.push({
    id: 189,
    name: "Desperate to the End (Protection + Knockback Resistance to Special Attacks)",
    description: "Defense force is rising, in the special technique, hardly Nokezori."
  });
  gAbilities.push({
    id: 190,
    name: "Desperation",
    description: "When your health is low, your damage is greatly increased"
  });
  gAbilities.push({
    id: 191,
    name: "Destructive Impulse (Dissection (Focus) + Earthshaker)",
    description: "Breaking parts or defeating Oni will restore  some focus. Also increases the damage of Club's Devastators"
  });
  gAbilities.push({
    id: 192,
    name: "Devastation",
    description: "Increases damage dealt by Precision Strikes."
  });
  gAbilities.push({
    id: 193,
    name: "Devoted Samurai (Exploit (Absorb) + Charity)",
    description: "Exposing the attack to 'demon' in the abnormal state, energy is restored, a united front gauge increased amount is increased."
  });
  gAbilities.push({
    id: 194,
    name: "Devotion",
    description: "Greatly increases Attack, but reduces the refill rate of the Focus Gauge."
  });
  gAbilities.push({
    id: 195,
    name: "Diffusion (Increase)",
    description: "Increases the number of Diffusions you can carry"
  });
  gAbilities.push({
    id: 196,
    name: "Diffusion (Reduce)",
    description: "Reduce the cooldown on Diffusion."
  });
  gAbilities.push({
    id: 197,
    name: "Diffusion (Time)",
    description: "Increases duration of Diffusion."
  });
  gAbilities.push({
    id: 198,
    name: "Diffusion+ (Aegis)",
    description: "Regeneration of the red part of your Health Gauge is increased while Diffusion is active."
  });
  gAbilities.push({
    id: 199,
    name: "Diffusion+ (Assist)",
    description: "Increases the amount the unity gauge rises for all when Diffusion is in effect"
  });
  gAbilities.push({
    id: 200,
    name: "Diffusion+ (Destroy)",
    description: "Breaking a Body Part while a Support Mitama is equipped to your Weapon has a chance to give an extra charge of Diffusion."
  });
  gAbilities.push({
    id: 201,
    name: "Diffusion+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Support Mitama equipped to your Weapon there is a chance to gain an extra charge of Diffusion."
  });
  gAbilities.push({
    id: 202,
    name: "Diffusion+ (Quicken)",
    description: "Shotens Cooldowns when taking damage with Diffusion in effect"
  });
  gAbilities.push({
    id: 203,
    name: "Diffusion+ (Reflect)",
    description: "Reflects a portion of the damage received back to your oppenent while the Diffusion skill is in effect"
  });
  gAbilities.push({
    id: 204,
    name: "Diffusion+ (Rigid)",
    description: "Makes it harder to be knocked back to all when Diffusion is in effect"
  });
  gAbilities.push({
    id: 205,
    name: "Diffusion+ (Swift)",
    description: "Increases movment speed to all when Diffusion is active"
  });
  gAbilities.push({
    id: 206,
    name: "Disciple (Reduce)",
    description: "Shortens the cooldown time for Disciple"
  });
  gAbilities.push({
    id: 207,
    name: "Disciple (Time)",
    description: "Increases the duration of Disciple ability."
  });
  gAbilities.push({
    id: 208,
    name: "Disciple+ (Amplify)",
    description: "Increases the amount of Health and Focus restored with Summon Disciple."
  });
  gAbilities.push({
    id: 209,
    name: "Disciple+ (Attributes)",
    description: "Of reification has been Kuoni in Golay Myojin Great attribute attack power is increased."
  });
  gAbilities.push({
    id: 210,
    name: "Disciple+ (Counter)",
    description: "When itself is damaged, the demon has been the attack reification has been Kuoni is in Golay Myojin made ​​to carry out the attack."
  });
  gAbilities.push({
    id: 211,
    name: "Disciple+ (Extend)",
    description: "Extends the duration of Summon Disciple after purifying an Oni or body part with the Ritual of Purification."
  });
  gAbilities.push({
    id: 212,
    name: "Dissection (Focus)",
    description: "Recover some Focus when defeating Oni or breaking Body Parts."
  });
  gAbilities.push({
    id: 213,
    name: "Dissection (Health)",
    description: "Recover some Health when defeating Oni or breaking Body Parts."
  });
  gAbilities.push({
    id: 214,
    name: "Divinity",
    description: "Recovery speed of the red part of the Health gauge is increased."
  });
  gAbilities.push({
    id: 215,
    name: "Domestic seen (Carnage (Time) + Carnage (Quicken))",
    description: "to extend the Mars effect of Shorai time, during the war god Shorai, and to destroy or site defeat the demon to shorten the Tamafuri use feeling"
  });
  gAbilities.push({
    id: 216,
    name: "Dragon God's Ward (Charity + Dissection (Health))",
    description: "a united front gauge increased amount is increased, physical fitness and to destroy or site defeat the 'demon' is restored."
  });
  gAbilities.push({
    id: 217,
    name: "Dragonslyaer (Offensive Stance+ (Wraith) + Earnest Blades)",
    description: "When Osamunogata, increased weapons gauge increased amount, t depending on the damage done, Kiki gauge increases."
  });
  gAbilities.push({
    id: 218,
    name: "Dream Nha become a human (All Ailments Become Sleep + Relaxation)",
    description: "All status ailments inflicted upon you turns into sleep. Additionally Health Recovery is increased while sleeping."
  });
  gAbilities.push({
    id: 219,
    name: "Dynastic Romanticism (Faster Cooldowns when Focus is at max.)",
    description: "when energy is at the maximum, to reduce the Tamafuri use interval."
  });
  gAbilities.push({
    id: 220,
    name: "Dynasty Restoration (Exigency + Wrath)",
    description: "when it is dying, the movement speed is increased, satisfaction is likely to occur."
  });
  gAbilities.push({
    id: 221,
    name: "Earnest Blades",
    description: "Increases 'stance' gauge in relation to the amount of damage dealt when in offensive stance."
  });
  gAbilities.push({
    id: 222,
    name: "Earthshaker",
    description: "Increases damage for Club's Devastator attack"
  });
  gAbilities.push({
    id: 223,
    name: "Ebullience",
    description: "Damage is increased while Focus is at Maximum."
  });
  gAbilities.push({
    id: 224,
    name: "Eccentric Talent (Restores HP and focus to all nearby when CON skills end)",
    description: "when the Kuoni disappears, physical strength and energy of allies within the range that includes its own to recover."
  });
  gAbilities.push({
    id: 225,
    name: "edge Musuhi (Charity + Fervor)",
    description: "Unity Gauge gains are increased. Also when you deal a Precision Strike restore Focus based on the damage dealt."
  });
  gAbilities.push({
    id: 226,
    name: "Elemental",
    description: "Elemental attack power is increased."
  });
  gAbilities.push({
    id: 227,
    name: "Elite Archer (Conviction + Exigency)",
    description: "You cannot be killed in a single blow while at Sufficient Health. Your Movement Speed is also increased while at Low Health."
  });
  gAbilities.push({
    id: 228,
    name: "Emergency to Ryugu (Chain + SPC Master (Accuracy))",
    description: "Will be able to use the Skills in the middle of the attack, While your Weapon Mitama is SPC, the Purification buff will also increase Precision."
  });
  gAbilities.push({
    id: 229,
    name: "Endless Pursuit (Verity + Heroe's Rally)",
    description: "satisfaction force is increased, when the satisfaction has occurred, to shorten the Tamafuri use interval."
  });
  gAbilities.push({
    id: 230,
    name: "Energy (Increase)",
    description: "Increases the number of times you can use Energy"
  });
  gAbilities.push({
    id: 231,
    name: "Energy (Reduce)",
    description: "Reduce the cooldown of Energy."
  });
  gAbilities.push({
    id: 232,
    name: "Energy (Time)",
    description: "Extends the duration of Energy"
  });
  gAbilities.push({
    id: 233,
    name: "Energy+ (Accuracy)",
    description: "Increases Precision Strike chance while Energy is active."
  });
  gAbilities.push({
    id: 234,
    name: "Energy+ (Bonus)",
    description: "Focus Recovery is further increased during Energy."
  });
  gAbilities.push({
    id: 235,
    name: "Energy+ (Exploit)",
    description: "Damage is increased when attacking an Oni suffering from a status ailment while Energy is active."
  });
  gAbilities.push({
    id: 236,
    name: "Energy+ (Havoc)",
    description: "Extends the duration of Energy after defeating an Oni or destroying a body part."
  });
  gAbilities.push({
    id: 237,
    name: "Energy+ (Purfiy)",
    description: "After purifying an Oni or Body part, if you have a Speed Mitama equipped to your Weapon there is a chance to gain an extra charge of Energy."
  });
  gAbilities.push({
    id: 238,
    name: "Energy+ (Quicken)",
    description: "Cooldowns of your Weapon Mitama abilties are reduced while Energy is active."
  });
  gAbilities.push({
    id: 239,
    name: "Energy+ (Range)",
    description: "Gives some of the effects of Energy to nearby allies"
  });
  gAbilities.push({
    id: 240,
    name: "Energy+ (Swift)",
    description: "Increases your movement speed by even more when using Energy."
  });
  gAbilities.push({
    id: 241,
    name: "Enlightened Spirit (Charity + Brandish)",
    description: "a united front gauge increased amount is increased, when the strength is maximum, satisfaction is likely to occur."
  });
  gAbilities.push({
    id: 242,
    name: "Eruption (Increase)",
    description: "Number of uses of Eruption is increased."
  });
  gAbilities.push({
    id: 243,
    name: "Eruption (Reduce)",
    description: "Reduce the cooldown of Eruption"
  });
  gAbilities.push({
    id: 244,
    name: "Eruption+ (Accuracy)",
    description: "Enables you to perfrorm precision strikes when using Eruption."
  });
  gAbilities.push({
    id: 245,
    name: "Eruption+ (Bolster)",
    description: "Increases the damage you inflict when using Eruption."
  });
  gAbilities.push({
    id: 246,
    name: "Eruption+ (Destroy)",
    description: "Connecting a Destroyer may restore Eruption stocks (SPT Style)"
  });
  gAbilities.push({
    id: 247,
    name: "Eruption+ (Raid)",
    description: "Eruption always deals full damage regardless of the Soul Gauges current charge level."
  });
  gAbilities.push({
    id: 248,
    name: "Eruption+ (Sneak)",
    description: "Makes it less likely to be targeted by Oni when using Eruption"
  });
  gAbilities.push({
    id: 249,
    name: "Escape from Reality (Stealth + Greed)",
    description: "less likely a target of 'demon', when you purify the 'demon' and site at the demon exorcism, rarely to two win the material."
  });
  gAbilities.push({
    id: 250,
    name: "Essence of Poetry (Expert Destroyer + Eruption+ (Destroy))",
    description: "weapon gauge increased amount is increased, and shed demon torn, rarely number of times of use of Yabutekinoho is restored"
  });
  gAbilities.push({
    id: 251,
    name: "Eternal Patriotism (Pursuit+ (Bolster) + Fountain+ (Bolster) + Eruption+ (Bolster))",
    description: "When the weapon Spirit is 'soul', drive on, RenNoboru, is damage in Yabutekinoho increase."
  });
  gAbilities.push({
    id: 252,
    name: "Evasion",
    description: "Increases the invulnability time of a dodge."
  });
  gAbilities.push({
    id: 253,
    name: "Exertion (Reduce)",
    description: "Reduce the cooldown of Exertion ability."
  });
  gAbilities.push({
    id: 254,
    name: "Exertion (Time)",
    description: "Increases the duration of Exertion ability."
  });
  gAbilities.push({
    id: 255,
    name: "Exertion+ (Amplify)",
    description: "During Exertion, Increases the fixed damage."
  });
  gAbilities.push({
    id: 256,
    name: "Exertion+ (Bonus)",
    description: "During Exertion, Focus is gradually restored."
  });
  gAbilities.push({
    id: 257,
    name: "Exertion+ (Nimble)",
    description: "Increases Attack Speed while Exertion ability is active."
  });
  gAbilities.push({
    id: 258,
    name: "Exertion+ (Shred)",
    description: "Connecting a Destroyer with Exertion active will extend its duration"
  });
  gAbilities.push({
    id: 259,
    name: "Expert Destroyer",
    description: "Increases the amount of points gained for the Weapon Gauge."
  });
  gAbilities.push({
    id: 260,
    name: "Exploding Fist",
    description: "Increases damage when hitting body parts inginited with Flurry."
  });
  gAbilities.push({
    id: 261,
    name: "Exploit (Accuracy)",
    description: "Increased chance for Precision Strikes when attacking an Oni suffering from a status ailment."
  });
  gAbilities.push({
    id: 262,
    name: "Exploit (Leech)",
    description: "Recover Health based on damage dealt when attacking an Oni suffering from a status ailment."
  });
  gAbilities.push({
    id: 263,
    name: "Exploit (Rage)",
    description: "Damage is increased when attacking an Oni suffering from a status ailment."
  });
  gAbilities.push({
    id: 264,
    name: "Exploit (Wraith)",
    description: "Increases the amount of points gained for the Weapon Gauge when attacking an Oni suffering from a status ailment"
  });
  gAbilities.push({
    id: 265,
    name: "Exploit (Absorb)",
    description: "Recover Stamina based on damage dealt when attacking an Oni suffering from a status ailment."
  });
  gAbilities.push({
    id: 266,
    name: "Extinguishment",
    description: "Protects the user from being burned."
  });
  gAbilities.push({
    id: 267,
    name: "Exuberance",
    description: "Increases the damage you inflict when your Health is at max."
  });
  gAbilities.push({
    id: 268,
    name: "Falling Petals",
    description: "Increases Attack Speed, and Decreases Focus Consumption of Frenzy"
  });
  gAbilities.push({
    id: 269,
    name: "Familial Bonds (Knockback resistance and full Defense gauge during any Claw Skill)",
    description: "Refills the Defense Gauge after using a Demon Hand Skill, and makes it harder to be knocked back when using a Demon Hand Skill."
  });
  gAbilities.push({
    id: 270,
    name: "Family Tradition (Heroes' Rally + Fervor)",
    description: "When you deal a Precision Strike reduce the Cooldown of your Weapon Mitama abilities. Also when you deal a Precision Strike restore Focus based on the damage dealt."
  });
  gAbilities.push({
    id: 271,
    name: "Famous Writings (Piety + Recovery+ (Range))",
    description: "Strengthens the effect of your Ritual of Purification. Additionally your Recover ability will also heal nearby allies."
  });
  gAbilities.push({
    id: 272,
    name: "Fervor",
    description: "Restores an amount of Focus based on the damage inflicted by a precision strike."
  });
  gAbilities.push({
    id: 273,
    name: "Fierce Resistance (Taking Damage shortens cooldowns)",
    description: "when damaged, to shorten the Tamafuri use interval"
  });
  gAbilities.push({
    id: 274,
    name: "Fitness",
    description: "Increases Attack, Defense and the max size of the Health Gauge."
  });
  gAbilities.push({
    id: 275,
    name: "Flowers Sakuragi, a person samurai (Lure + Frontal Assault)",
    description: "be easily targeted from the 'demon', when the attack from the front, damage is increased."
  });
  gAbilities.push({
    id: 276,
    name: "Flying Blade",
    description: "Focus cost of Twisting Slash is reduced and the Invulerability time of Twisting Slash is extended."
  });
  gAbilities.push({
    id: 277,
    name: "Follower (Increase)",
    description: "Increases the number of Follower you can carry"
  });
  gAbilities.push({
    id: 278,
    name: "Follower (Reduce)",
    description: "Reduces the cooldown time on CON's Square ability."
  });
  gAbilities.push({
    id: 279,
    name: "Follower (Time)",
    description: "Increases duration Follower"
  });
  gAbilities.push({
    id: 280,
    name: "Follower+ (Accuracy)",
    description: "Osamushu ed by reification has been Kuoni of attack is to generate satisfaction."
  });
  gAbilities.push({
    id: 281,
    name: "Follower+ (Attributes)",
    description: "Great attribute attack force of reification has been Kuoni rises in Osamushu s."
  });
  gAbilities.push({
    id: 282,
    name: "Follower+ (Counter)",
    description: "Follower's Kunoi will counterattack when you are damaged when this skill is active"
  });
  gAbilities.push({
    id: 283,
    name: "Follower+ (Damage)",
    description: "Follower's Kuoni will attack while you are purifying and this skill is active"
  });
  gAbilities.push({
    id: 284,
    name: "Follower+ (Destroy)",
    description: "Breaking a Body Part while a CON Mitama is equipped to your Weapon has a chance to give an extra charge of  Follower"
  });
  gAbilities.push({
    id: 285,
    name: "Follower+ (Exploit)",
    description: "Follower's Kuoni will deal more damage to oni suffering from ailments"
  });
  gAbilities.push({
    id: 286,
    name: "Follower+ (Purify)",
    description: "Purifying body parts may restore  Follower stocks"
  });
  gAbilities.push({
    id: 287,
    name: "Follower+ (Support)",
    description: "Causes Summon Follower to Circle Allies and attack the enemy"
  });
  gAbilities.push({
    id: 288,
    name: "For the People (Restore HP to nearby allies when dealing Precision strikes)",
    description: "When sympathy occurs, depending on the damage given, the strength of the ally within range is recovered."
  });
  gAbilities.push({
    id: 289,
    name: "Fortification",
    description: "Increases damage of Brace."
  });
  gAbilities.push({
    id: 290,
    name: "Fortitude",
    description: "Decreases the damage taken and focus consumption when executing a Gauntlet's Block"
  });
  gAbilities.push({
    id: 291,
    name: "Fortuity (Reduce)",
    description: "Reduce the cooldown on Fortuity"
  });
  gAbilities.push({
    id: 292,
    name: "Fortuity+ (Amplify)",
    description: "Increases effects of Fortuity. But rarely become sealed and health brought to near death"
  });
  gAbilities.push({
    id: 293,
    name: "Fortuity+ (Assist)",
    description: "In odd soul, of the increase a united front gauge effect size is increased."
  });
  gAbilities.push({
    id: 294,
    name: "Fortuity+ (Blessing)",
    description: "Increases skill stock restoration when it triggers from Fortuity"
  });
  gAbilities.push({
    id: 295,
    name: "Fortuity+ (Potency)",
    description: "Increase the amount of physical strength and energy recovery."
  });
  gAbilities.push({
    id: 296,
    name: "Fortuity+ (Range)",
    description: "Give the effects of Fortuity to nearby allies. But rarely become sealed and health brought to near death"
  });
  gAbilities.push({
    id: 297,
    name: "Fortuity+ (Speculation)",
    description: "May provide you with all of the effects of Fortuity, but occasionally reduces your Health and blocks your Skills."
  });
  gAbilities.push({
    id: 298,
    name: "Fortune (Increase)",
    description: "Number of uses of Fortune is increased."
  });
  gAbilities.push({
    id: 299,
    name: "Fortune (Reduce)",
    description: "Reduce the cooldown on Fortune"
  });
  gAbilities.push({
    id: 300,
    name: "Fortune (Time)",
    description: "Increases the duration of Fortune"
  });
  gAbilities.push({
    id: 301,
    name: "Fortune+ (Accuracy)",
    description: "Changes your Precision stat based on your Fortune"
  });
  gAbilities.push({
    id: 302,
    name: "Fortune+ (Amplify)",
    description: "Greatly changes your stats depending on your fortune"
  });
  gAbilities.push({
    id: 303,
    name: "Fortune+ (Assist)",
    description: "Depending on the fortune that came out in the fortune united front gauge increase amount changes."
  });
  gAbilities.push({
    id: 304,
    name: "Fortune+ (Attributes)",
    description: "Changes the amount of elemental damage you inflict depending on your Fortune"
  });
  gAbilities.push({
    id: 305,
    name: "Fortune+ (Blessing)",
    description: "When Fortune comes out Very Lucky, will not consume a Fortune stock"
  });
  gAbilities.push({
    id: 306,
    name: "Fortune+ (Bonus)",
    description: "On Very Lucky Fortunes, Restore Focus, including to allies in range."
  });
  gAbilities.push({
    id: 307,
    name: "Fortune+ (Gamble)",
    description: "Makes it easier to obtain either Very Lucky or Very Unlucky Fortunes."
  });
  gAbilities.push({
    id: 308,
    name: "Fortune+ (Kismet)",
    description: "When you use a fortune, More likely to get positive results."
  });
  gAbilities.push({
    id: 309,
    name: "Fortune+ (Miracle)",
    description: "Increases chances at very very lucky fortunes"
  });
  gAbilities.push({
    id: 310,
    name: "Fortune+ (Quicken)",
    description: "On Very Lucky Fortunes, shorten cooldowns, including to allies in range."
  });
  gAbilities.push({
    id: 311,
    name: "Fortune+ (Recover)",
    description: "On Very Lucky Fortunes, Restore Health, including to allies in range."
  });
  gAbilities.push({
    id: 312,
    name: "Fortune+ (Sturdy)",
    description: "Changes the amount of damage you receive depending on your Fortune"
  });
  gAbilities.push({
    id: 313,
    name: "Fortune+ (Surprise)",
    description: "Changes your Ailment stat based on your Fortune"
  });
  gAbilities.push({
    id: 314,
    name: "Fortune+ (Swift)",
    description: "Your Movement Speed will vary based on the results of your Fortune ability."
  });
  gAbilities.push({
    id: 315,
    name: "Fortune+ (Ward)",
    description: "Removes the chance of getting a bad fortune if you defeat an oni or break a part beforehand"
  });
  gAbilities.push({
    id: 316,
    name: "Fortune+ (Wraith)",
    description: "Refills the Weapon Gauge of you and your nearby allies when your Fortune is Very Unlucky."
  });
  gAbilities.push({
    id: 317,
    name: "Fountain (Increase)",
    description: "Number of uses of Fountain is increased."
  });
  gAbilities.push({
    id: 318,
    name: "Fountain (Reduce)",
    description: "Reduce the cooldown of Fountain."
  });
  gAbilities.push({
    id: 319,
    name: "Fountain+ (Assist)",
    description: "Makes it easier to fill the unity gauge when attacking with Fountain active"
  });
  gAbilities.push({
    id: 320,
    name: "Fountain+ (Attract)",
    description: "Makes it easier to draw Oni's attention to you when using Fountain"
  });
  gAbilities.push({
    id: 321,
    name: "Fountain+ (Bolster)",
    description: "Increases damage of Fountain"
  });
  gAbilities.push({
    id: 322,
    name: "Fountain+ (Exploit)",
    description: "Fountain deals increased damage to Oni suffering from a status ailments."
  });
  gAbilities.push({
    id: 323,
    name: "Fountain+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Spirit Mitama equipped to your Weapon there is a chance to gain an extra charge of Fountain."
  });
  gAbilities.push({
    id: 324,
    name: "Fountain+ (Surprise)",
    description: "Ability inflicts status ailment damage based on users weapon."
  });
  gAbilities.push({
    id: 325,
    name: "Four Guardians (Chain + Precision increase to charge attacks)",
    description: "Mitama abilities can be activated during attacks. Also charged skills have an increased chance to deal Precision Strikes."
  });
  gAbilities.push({
    id: 326,
    name: "Frontal Assault",
    description: "Increases damage when attacking from the front"
  });
  gAbilities.push({
    id: 327,
    name: "Full Moon Poem (Lure + Dissection (Quicken))",
    description: "Increased chance of gaining enemies attention. Also reduce the cooldown on Weapon Mitama abilities when defeating Oni or breaking Body Parts."
  });
  gAbilities.push({
    id: 328,
    name: "Futile Rebellion (Assertion + Protection of Heroes)",
    description: "no longer become a sealed state, when you use the Tamafuri, rarely use the number of times is not reduced."
  });
  gAbilities.push({
    id: 329,
    name: "Gakyo Rojin Manji (Ebullience + Restart)",
    description: "Damage is increased while Focus is at Maximum. Additionally when a Weapon Mitama ability expires in rare cases it will be instantly ready to use again."
  });
  gAbilities.push({
    id: 330,
    name: "Giantkiller (Oni Burial+ (Destroy) + Oni Burial+ (Wraith))",
    description: "Increases Oni Burial's damage, increases the amount of points gained for the weapon gauge when using Oni Burial"
  });
  gAbilities.push({
    id: 331,
    name: "Gift of Foresight (Follower (Increase) + CON Spirits will change type to Oni's weakness)",
    description: "Osamushu use the number to increase in the s, when Kuoni is making an attack to follow, see through the weak Great attribute of 'demon', changes to the Great attribute."
  });
  gAbilities.push({
    id: 332,
    name: "Glorious Blossoms (Panacea+ (Assist) + Restart)",
    description: "further increase in the united front gauge when using a variable Wakamizu. Also when a Weapon Mitama ability expires in rare cases it will be instantly ready to use again."
  });
  gAbilities.push({
    id: 333,
    name: "God of Learning (Elemental + Knowledge (Absorb))",
    description: "Elemental Damage is increased. Recover Focus when inflicting Elemental Damage to Enemies."
  });
  gAbilities.push({
    id: 334,
    name: "God of War (Carnage (Increase) + Carnage+ (Shred))",
    description: "Increases the number of uses of Carnage. Also while Carnage is active breaking a Body Part extends the duration of Carnage."
  });
  gAbilities.push({
    id: 335,
    name: "God of War's Pride (Swordsmanship + Devastation)",
    description: "Increases the number of uses of Carnage. Also while Carnage is active breaking a Body Part extends the duration of Carnage."
  });
  gAbilities.push({
    id: 336,
    name: "Godly Bow (Prescience++)",
    description: "reservoir to dramatically reduce the time of the reservoir attack"
  });
  gAbilities.push({
    id: 337,
    name: "Gouge Master",
    description: "Increases damage of Gouges."
  });
  gAbilities.push({
    id: 338,
    name: "Great Ambition",
    description: "Increases Invulnerability time and damage of Dual Knives' Swallow Dive"
  });
  gAbilities.push({
    id: 339,
    name: "Great Gambler (Random+ (Gamble)+)",
    description: "When you use the Unputenpu, probability and a strong Tamafuri will fire probability of loss is greatly increased."
  });
  gAbilities.push({
    id: 340,
    name: "Great Unifier (Swiftness + Agility+ (Dual))",
    description: "the movement speed is increased, in Utsusemi, but would like to disable attack up to two times, use interval is extended."
  });
  gAbilities.push({
    id: 341,
    name: "Guardian Prayer (Lifesaver + Oni Eater+ (Assist))",
    description: "When you rescue an ally they revive with more Health. when the grant element of the captured Great attributes in the demon Eating a weapon, a united front gauge increases"
  });
  gAbilities.push({
    id: 342,
    name: "Gymnast",
    description: "Increases movement distance while dodging."
  });
  gAbilities.push({
    id: 343,
    name: "Haku Enthusiast",
    description: "Increases the amount of Haku gained."
  });
  gAbilities.push({
    id: 344,
    name: "Hand be safety of the sacred treasures (Divinity + Oni Eater+ (Attributes))",
    description: "increased recovery rate of the red part of the stamina gauge, time that can be granted an element of the captured Great attributes in the demon Eating a weapon becomes longer."
  });
  gAbilities.push({
    id: 345,
    name: "Handsome Woman (SPT Master (Augment) + SPT Master (Bolster))",
    description: "When the weapon Spirit is 'soul', the soul gauge is likely to accumulate, additional damage of the ability to increase"
  });
  gAbilities.push({
    id: 346,
    name: "Heart of Mononofu (Ablution+ (Wraith) + Ablution+ (Potency))",
    description: "When you destroy the effect site of Dan祓, weapon gauge is increased, physical strength and energy is restored."
  });
  gAbilities.push({
    id: 347,
    name: "Heaven's Wrath (Reduce)",
    description: "Reduces the cooldown time on Heaven's Wrath."
  });
  gAbilities.push({
    id: 348,
    name: "Heaven's Wrath+ (Bonus)",
    description: "During Heaven's Wrath, Focus Restoration is increased"
  });
  gAbilities.push({
    id: 349,
    name: "Heaven's Wrath+ (Insight)",
    description: "Increases the damage of Destroyers while Heaven's Wrath is active"
  });
  gAbilities.push({
    id: 350,
    name: "Heaven's Wrath+ (Minimize)",
    description: "Health loss is reduced while Heaven's Wrath ability is active."
  });
  gAbilities.push({
    id: 351,
    name: "Heaven's Wrath+ (Quicken)",
    description: "During Heaven's Wrath, Shortens cooldowns"
  });
  gAbilities.push({
    id: 352,
    name: "Heaven's Wrath+ (Wraith)",
    description: "Attacking Oni while Heaven's Wrath is active will gain extra Weapon Gauge points."
  });
  gAbilities.push({
    id: 353,
    name: "Heavenly Blow",
    description: "Attack speed of Kagura is increased, damage is increased."
  });
  gAbilities.push({
    id: 354,
    name: "Heroes' Rally",
    description: "When you deal a Precision Strike reduce the Cooldown of your Mitama Skills."
  });
  gAbilities.push({
    id: 355,
    name: "Heroic Resolve (Heroes' Rally + Recovery+ (Heal))",
    description: "When you deal a Precision Strike reduce the Cooldown of your Weapon Mitama abilities. Also when using the Recover ability cure any status ailments from yourself and nearby allies."
  });
  gAbilities.push({
    id: 356,
    name: "HLG Master (Cure)",
    description: "You can attack your allies to restore their Health if a Healing Mitama is equipped to your Weapon."
  });
  gAbilities.push({
    id: 357,
    name: "HLG Master (Quicken)",
    description: "You can attack your allies to shorten their cooldowns if a Healing Mitama is equipped to your Weapon."
  });
  gAbilities.push({
    id: 358,
    name: "HLG Master (Rally)",
    description: "You can attack your allies to restore their Focus if a Healing Mitama is equipped to your Weapon."
  });
  gAbilities.push({
    id: 359,
    name: "Hospitality of young proprietress (Share weapon gauge gains with allies)",
    description: "its own grants to ally within a certain percentage of the weapon gauge obtained."
  });
  gAbilities.push({
    id: 360,
    name: "Illumination (Reduce)",
    description: "Reduce the cooldown on Illumination ability."
  });
  gAbilities.push({
    id: 361,
    name: "Illumination (Time)",
    description: "Increases the duration of Illumination ability."
  });
  gAbilities.push({
    id: 362,
    name: "Illumination+ (Accuracy)",
    description: "Increases the duration of Illumination ability."
  });
  gAbilities.push({
    id: 363,
    name: "Illumination+ (Amplify)",
    description: "Damage is increased to the location exposed by Illumination ability."
  });
  gAbilities.push({
    id: 364,
    name: "Illumination+ (Havoc)",
    description: "Extends the duration of Illumination after defeating an Oni or destroying a body part."
  });
  gAbilities.push({
    id: 365,
    name: "Illumination+ (Restart)",
    description: "Completley destroying the body part targeted by Illumination, will remove its cooldown"
  });
  gAbilities.push({
    id: 366,
    name: "Illusion (Increase)",
    description: "Increases the number of times you can use Illusion"
  });
  gAbilities.push({
    id: 367,
    name: "Illusion (Reduce)",
    description: "Reduces the cooldown of Illusion"
  });
  gAbilities.push({
    id: 368,
    name: "Illusion+ (Aegis)",
    description: "Increases recovery rate of the Red part of the Health gauge when in Illusions effect"
  });
  gAbilities.push({
    id: 369,
    name: "Illusion+ (Assist)",
    description: "Increases the amount the Unity gauge rises when in Illusion's effect"
  });
  gAbilities.push({
    id: 370,
    name: "Illusion+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Deceit Mitama equipped to your Weapon there is a chance to gain an extra charge of Illusion"
  });
  gAbilities.push({
    id: 371,
    name: "Illusion+ (Rage)",
    description: "Increases Attack Power while Illusion is active."
  });
  gAbilities.push({
    id: 372,
    name: "Illusion+ (Sanctity)",
    description: "Increases purification effect while Illusion is active"
  });
  gAbilities.push({
    id: 373,
    name: "Illusion+ (Sturdy)",
    description: "Increases Defense  while Illusion is active"
  });
  gAbilities.push({
    id: 374,
    name: "Illusion+ (Surprise)",
    description: "Increases chances of inflicting ailments while Illusion is active"
  });
  gAbilities.push({
    id: 375,
    name: "Immortal (Reduce)",
    description: "Reduces the Skill cooldown time for Immortal"
  });
  gAbilities.push({
    id: 376,
    name: "Immortal+ (Frantic)",
    description: "Treats your status as near death while Immortal is active"
  });
  gAbilities.push({
    id: 377,
    name: "Immortal+ (Leech)",
    description: "Recover Health by attacking Oni while Immortal is active."
  });
  gAbilities.push({
    id: 378,
    name: "Immortal+ (Reflect)",
    description: "Taking damage will reflect a portion of the it to the attacking Oni."
  });
  gAbilities.push({
    id: 379,
    name: "Immortal+ (Rigid)",
    description: "Makes it harder to be knocked back when Immortal is active"
  });
  gAbilities.push({
    id: 380,
    name: "Immortal (Time)",
    description: "Increases the duration of Immortal."
  });
  gAbilities.push({
    id: 381,
    name: "Impulsive Justice (Desperation + Wrath)",
    description: "when it is dying, increased damage, satisfaction is likely to occur."
  });
  gAbilities.push({
    id: 382,
    name: "In Search of Might (Devotion + Fervor)",
    description: "The attack power is greatly increased, energy recovery rate decreases.  In addition when the satisfaction occurs, energy is recovered in response to the damage done."
  });
  gAbilities.push({
    id: 383,
    name: "Incandescence",
    description: "Makes it easier to set body parts on fire for Fire Hook."
  });
  gAbilities.push({
    id: 384,
    name: "Incorruptible Judgment (Onslaught (Reduce) + Onslaught+ (Qinggong))",
    description: "Reduces the Skill cooldown time for Onslaught, and reduces the Focus consumed when using it.Requires DEF Mitamas in both Weapon and Demon Hand (This may be a bug.)"
  });
  gAbilities.push({
    id: 385,
    name: "Indelile Cuteness (Very small HP regen to all nearby + Tenko's Defense Up)",
    description: "physical strength of ally you are within range, including itself gradually recover.  Further defense of Tenkitsune greatly increases."
  });
  gAbilities.push({
    id: 386,
    name: "Infusion",
    description: "Increases damage of Flail Throws"
  });
  gAbilities.push({
    id: 387,
    name: "innate qualities (Restart+)",
    description: "When you use the Tamafuri, rarely all of Tamafuri is ready-to-use."
  });
  gAbilities.push({
    id: 388,
    name: "Insight",
    description: "Damage from Destroyers is increased."
  });
  gAbilities.push({
    id: 389,
    name: "Instant Strike (Insight + Oni Burial+ (Destroy))",
    description: "Damage is increased to give in demon torn and kisou"
  });
  gAbilities.push({
    id: 390,
    name: "Intensity (Increase)",
    description: "Increases the number of Intensitys you can carry"
  });
  gAbilities.push({
    id: 391,
    name: "Intensity (Reduce)",
    description: "Shortens cooldown for Intensity"
  });
  gAbilities.push({
    id: 392,
    name: "Intensity (Time)",
    description: "Increases the duration of Intensity"
  });
  gAbilities.push({
    id: 393,
    name: "Intensity+ (Amplify)",
    description: "Further improves the amount of Weapon Gauge gained while Intensity is active."
  });
  gAbilities.push({
    id: 394,
    name: "Intensity+ (Destroy)",
    description: "Breaking a Body Part while a PLN Mitama is equipped to your Weapon has a chance to give an extra charge of Intensity."
  });
  gAbilities.push({
    id: 395,
    name: "Intensity+ (Link)",
    description: "Adds the effects of Breaker and Ablution when activating Intensity."
  });
  gAbilities.push({
    id: 396,
    name: "Intensity+ (Range)",
    description: "Gives the effect of Intensity to nearby allies"
  });
  gAbilities.push({
    id: 397,
    name: "Interesting Woman (Attack Up when having ailments + Swordsmanship)",
    description: "Increases Damage while suffering from a Status Ailment.  Also when a Precision Strike occurs Weapon Gauge gained is increased."
  });
  gAbilities.push({
    id: 398,
    name: "Interwoven Bonds (Phoenix+ (Impulse) + Phoenix (Time))",
    description: "Triggers Phoenix even after defeating an Oni or destroying a body part, and extends the duration of it."
  });
  gAbilities.push({
    id: 399,
    name: "Intesity+ (Insight)",
    description: "Increases Destroyer damage when Intensity is in effect"
  });
  gAbilities.push({
    id: 400,
    name: "Invention King (Expert Destroyer + Charity)",
    description: "increase the amount of weapons gauge and a united front gauge rises."
  });
  gAbilities.push({
    id: 401,
    name: "Iris (SPT Master (Quicken)+)",
    description: "When the weapon Spirit is 'soul', to shorten the Tamafuri use interval depending on the amount of the consumed soul gauge"
  });
  gAbilities.push({
    id: 402,
    name: "Japan's Finest Warrior (Fervor + Prescience)",
    description: "When the satisfaction occurs, energy is restored in response to the damage done, to reduce the reservoir time of reservoir attack"
  });
  gAbilities.push({
    id: 403,
    name: "Kabuki Founder (Paradox+ (Attract) + Paradox+ (Link))",
    description: "Void Roh jaw is made ​​to attract the site, to give the effect of祓殿."
  });
  gAbilities.push({
    id: 404,
    name: "Kanna Kamui (Elemental + Oni Eater (Reduce))",
    description: "Great attribute attack power is increased, re-use interval of Geopulse using Oni喰is shortened."
  });
  gAbilities.push({
    id: 405,
    name: "Keen Judgment (Heroe's Rally + Expert Destroyer)",
    description: "When the satisfaction occurs, shorten the Tamafuri use interval, weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 406,
    name: "Kengo Shogun (Devastation + Heroes' Rally)",
    description: "Precision Strikes deal increased Damage. Also will shorten the cooldown of your Weapon Mitama abilities."
  });
  gAbilities.push({
    id: 407,
    name: "Kindly Host (Recovery+ (Bonus) + Recovery+ (Range))",
    description: "Recover Focus proportional to the Health gained when using the Recovery ability. Nearby allies are also effected by your Recover ability."
  });
  gAbilities.push({
    id: 408,
    name: "Kitayama Culture (Lure + Greed)",
    description: "but be easily targeted to the 'demon', when you purify the 'demon' and site at the demon exorcism, rarely to two win the material."
  });
  gAbilities.push({
    id: 409,
    name: "Knights of the Round Table (DEF Master (Valiant) + Universal DEF Master (Protect))",
    description: "Increases the Max size of the Defense gauge, Defense gauge naturally recovers and is available regardless of Weapon Mitama type"
  });
  gAbilities.push({
    id: 410,
    name: "Knowledge (Absorb)",
    description: "Recover Focus based on Elemental damage dealt."
  });
  gAbilities.push({
    id: 411,
    name: "Knowledge (Leech)",
    description: "Restores an amount of Health based on the damgae inflicted by elemental attacks."
  });
  gAbilities.push({
    id: 412,
    name: "Knowledge of Western medicine (Recovery+ (Amplify) + Recovery+ (Bonus))",
    description: "an effective amount of healing is increased, energy also to recover depending on the amount of recovery."
  });
  gAbilities.push({
    id: 413,
    name: "Kobo Daishi (Piety+)",
    description: "Greatly strengthens the effect of your Ritual of Purification."
  });
  gAbilities.push({
    id: 414,
    name: "Kunoichi Toryo (Stealth + Heroe's Rally)",
    description: "less likely a target of 'demon', when the satisfaction has occurred, to shorten the Tamafuri use interval."
  });
  gAbilities.push({
    id: 415,
    name: "Large shamans (Affliction + Lowered Immunity)",
    description: "state abnormal attack power is increased, abnormal state resistance of the count on kisou 'demon' is reduced."
  });
  gAbilities.push({
    id: 416,
    name: "LCK Master (Fortune)",
    description: "Purification has a greater chance at restoring Fortune stocks"
  });
  gAbilities.push({
    id: 417,
    name: "LCK Master (Random)",
    description: "Purification has a greater chance at restoring Random stocks"
  });
  gAbilities.push({
    id: 418,
    name: "LCK Master (Recovery)",
    description: "Purification has a greater chance at restoring Recovery stocks"
  });
  gAbilities.push({
    id: 419,
    name: "Leech (Increase)",
    description: "Number of uses of Leech is increased."
  });
  gAbilities.push({
    id: 420,
    name: "Leech (Reduce)",
    description: "Reduces the cooldown time of Leech"
  });
  gAbilities.push({
    id: 421,
    name: "Leech (Time)",
    description: "Increases the duration of Leech."
  });
  gAbilities.push({
    id: 422,
    name: "Leech+ (Absorb)",
    description: "Recover Focus by Draining Health with Leech active."
  });
  gAbilities.push({
    id: 423,
    name: "Leech+ (Amplify)",
    description: "Steals an even larger amount of Health when using Leech."
  });
  gAbilities.push({
    id: 424,
    name: "Leech+ (Havoc)",
    description: "Extends the duration of Leech after defeating an Oni or destroying a body part."
  });
  gAbilities.push({
    id: 425,
    name: "Leech+ (Purify)",
    description: "Purifying body parts may restore Leech stocks"
  });
  gAbilities.push({
    id: 426,
    name: "Leech+ (Quicken)",
    description: "Shorten the cooldown of your Weapon Mitama abilities by dealing damage while Leech is active."
  });
  gAbilities.push({
    id: 427,
    name: "Leech+ (Range)",
    description: "Enables nearby allies to recieve half the benefits of your Leech."
  });
  gAbilities.push({
    id: 428,
    name: "Leech+ (Rigid)",
    description: "Makes it harder to be knocked back when Leech is active"
  });
  gAbilities.push({
    id: 429,
    name: "Leech+ (Wraith)",
    description: "Increases points gained for the Weapon Gauge by dealing damage with Leech active."
  });
  gAbilities.push({
    id: 430,
    name: "Lifebringer",
    description: "Recovers Focus when attacking oni with Vacuum Slash or Tiger's Den"
  });
  gAbilities.push({
    id: 431,
    name: "Lifesaver",
    description: "Restores a larger amount of an alliy's health when you rescue them from a KO"
  });
  gAbilities.push({
    id: 432,
    name: "Light Brushstrokes (Heroes' Rally + Dissection (Focus))",
    description: "When you deal a Precision Strike reduce the Cooldown of your Weapon Mitama abilities. Also recover some Focus when defeating Oni or breaking Body Parts."
  });
  gAbilities.push({
    id: 433,
    name: "Light Shades of Color (Barrier+ (Nimble) + Barrier+ (Wraith))",
    description: "in amano-iwato, attack speed and weapon gauge increased amount is increased"
  });
  gAbilities.push({
    id: 434,
    name: "Lightning Charge (Oni Burial+ (Quicken))",
    description: "Reduces Skill cooldown times after a successful Oni Burial."
  });
  gAbilities.push({
    id: 435,
    name: "Lightspeed Thrust",
    description: "Increases Attack Speed of Rush."
  });
  gAbilities.push({
    id: 436,
    name: "Limitless Courage (Dissection (Health) + Acrobat+ (Evade))",
    description: "Recover some Health when defeating Oni or breaking Body Parts. Also while SPD's Armor ability is active. Focus cost of Dodge is reduced and Invulerability time is increased."
  });
  gAbilities.push({
    id: 437,
    name: "Lineup of rock-solid (Fitness + Charity)",
    description: "attack power, and defense force, the maximum value of physical strength rise, a united front gauge is likely to rise"
  });
  gAbilities.push({
    id: 438,
    name: "Listless look (Affliction + Exploit (Absorb))",
    description: "state abnormal attack power is increased.  Further, when the shed attack to 'demon' in the abnormal state, energy is restored."
  });
  gAbilities.push({
    id: 439,
    name: "Literary Warrior (Fitness + Prescience)",
    description: "Attack Power, Defense Power, and Maximum Health are all increased. Also reduces times on Charge attacks."
  });
  gAbilities.push({
    id: 440,
    name: "Love Troubles (Contagion+ (Absorb) + Contagion+ (Amplify))",
    description: "When you use the Kamibin Onidoku, energy ally is restored you are within range, including its own, damage of deadly poison to give increases."
  });
  gAbilities.push({
    id: 441,
    name: "Lovestruck",
    description: "Shooting allies with the Rifle will recover their health slightly."
  });
  gAbilities.push({
    id: 442,
    name: "Loyal Warrior Monk (Oni Throw+ (Assist) + Oni Throws fill Defense gauge to all)",
    description: "When a successful return demon, further increases the united front gauge, defense gauge of allies within the range is increased."
  });
  gAbilities.push({
    id: 443,
    name: "Luminescence (Reduce)",
    description: "Reduce the cooldown of ATK Hand ability."
  });
  gAbilities.push({
    id: 444,
    name: "Luminescence (Time)",
    description: "Extends the duration of Luminescence."
  });
  gAbilities.push({
    id: 445,
    name: "Luminescence+ (Accuracy)",
    description: "Makes it easier to achieve a precision strike when using Luminescence."
  });
  gAbilities.push({
    id: 446,
    name: "Luminescence+ (Amplify)",
    description: "Increases the effectiveness of Luminescence."
  });
  gAbilities.push({
    id: 447,
    name: "Luminescence+ (Shred)",
    description: "Extends the duration of Luminescence after a successful Destroyer attack."
  });
  gAbilities.push({
    id: 448,
    name: "Lure",
    description: "Increased chance of gaining enemies attention."
  });
  gAbilities.push({
    id: 449,
    name: "Magical Beads (Quicksilver+ (Assist) + Quicksilver+ (Recover))",
    description: "During Kamikaka, a united front gauge increased amount is increased, to restore the strength of ally."
  });
  gAbilities.push({
    id: 450,
    name: "Majesty",
    description: "Increases the amount the Weapon Gauge rises by when your Health is at max."
  });
  gAbilities.push({
    id: 451,
    name: "Many of love (Precision strikes cure ailments, even to allies and add Unity)",
    description: "When the satisfaction occurs, the abnormal state is restored, a united front gauge increases.  When you restore the abnormal state of the allies, united front gauge is further increased."
  });
  gAbilities.push({
    id: 452,
    name: "Master Assassin",
    description: "Decreases the amount of time needed to charge a Flail throw attack. Decreases Focus Consumption of Hurricane Strike"
  });
  gAbilities.push({
    id: 453,
    name: "Master of the samurai (Cooldowns shorten on every strike)",
    description: "Exposing the attack to demons, to shorten the Tamafuri use interval."
  });
  gAbilities.push({
    id: 454,
    name: "Master Swordsman (Aerial Focus + Aerial Assault)",
    description: "in pounce, satisfaction is likely to occur, will not consume energy in Tobinoki beating of in pounce."
  });
  gAbilities.push({
    id: 455,
    name: "Messenger of the day origin (Piety + Purification (Rigid))",
    description: "the effect of demon exorcism rises, in demon exorcism, it is difficult Nokezori"
  });
  gAbilities.push({
    id: 456,
    name: "Might (Increase)",
    description: "Number of uses of Might is increased."
  });
  gAbilities.push({
    id: 457,
    name: "Might (Reduce)",
    description: "Reduces the Skill cooldown time for Might."
  });
  gAbilities.push({
    id: 458,
    name: "Might (Time)",
    description: "Extrends the duration of Might"
  });
  gAbilities.push({
    id: 459,
    name: "Might+ (Attributes)",
    description: "Elemental Damage is increased while Might is active."
  });
  gAbilities.push({
    id: 460,
    name: "Might+ (Havoc)",
    description: "Extends the duration of Might after defeating an Oni or destroying a body part."
  });
  gAbilities.push({
    id: 461,
    name: "Might+ (Nimble)",
    description: "Your Attack Speed is increased while Might is active."
  });
  gAbilities.push({
    id: 462,
    name: "Might+ (Purify)",
    description: "Occasionally restores Might Stocks after purifying Oni Parts."
  });
  gAbilities.push({
    id: 463,
    name: "Might+ (Rage)",
    description: "Increases the effectiveness of Might."
  });
  gAbilities.push({
    id: 464,
    name: "Might+ (Range)",
    description: "Enables nearby allies to recieve half the benefits of your Might."
  });
  gAbilities.push({
    id: 465,
    name: "Might+ (Sturdy)",
    description: "Applies the effects of Might to your Defense as well."
  });
  gAbilities.push({
    id: 466,
    name: "Might+ (Surprise)",
    description: "Increases chances to inflict ailments when Might is active"
  });
  gAbilities.push({
    id: 467,
    name: "Mind and Body (Devastation + Brandish)",
    description: "Increases damage dealt by Precision Strikes. Also increases your chance for Precision Strikes while your Health is at maximum."
  });
  gAbilities.push({
    id: 468,
    name: "Mindtrap",
    description: "Restores Focus based on the amount of the Assault Gauge  when using Strong Deflection"
  });
  gAbilities.push({
    id: 469,
    name: "Mirage (Reduce)",
    description: "Reduces the cooldown time on Mirage ability."
  });
  gAbilities.push({
    id: 470,
    name: "Mirage (Time)",
    description: "Increases the duration of Mirage ability."
  });
  gAbilities.push({
    id: 471,
    name: "Mirage+ (Attributes)",
    description: "Increases Elemental Damage when Mirage is active"
  });
  gAbilities.push({
    id: 472,
    name: "Mirage+ (Nimble)",
    description: "Increases Attack Speed while Mirage ability is active."
  });
  gAbilities.push({
    id: 473,
    name: "Mirage+ (Quicken)",
    description: "Reduces Skill cooldown times when using Mirage."
  });
  gAbilities.push({
    id: 474,
    name: "Mirage+ (Wraith)",
    description: "Increases the amount the Weapon Gauge rises by when using Mirage."
  });
  gAbilities.push({
    id: 475,
    name: "Misanthropy of beauty (Knowledge (Absorb) + Exploit (Rage))",
    description: "energy is restored in accordance with the damage dealt by the Great attribute attack, damage to the 'demon' in the abnormal state is increased."
  });
  gAbilities.push({
    id: 476,
    name: "Mitama Pulse",
    description: "Increases the damage you inflict against Miasmal nodes"
  });
  gAbilities.push({
    id: 477,
    name: "Money Opens All Doors (Haku Collector + Injured (Assist))",
    description: "Increase the amount of Haku obtained. Also Unity Gauge gains are increased while your Health is low.."
  });
  gAbilities.push({
    id: 478,
    name: "Moonlight Blossom (Apothecary (Reduce) + Apothecary (Health))",
    description: "Using interval of Yakushi is shortened, when using the Yakushi, physical strength is restored."
  });
  gAbilities.push({
    id: 479,
    name: "Moxibustion",
    description: "Focus is restored when detonating Kuna."
  });
  gAbilities.push({
    id: 480,
    name: "Muscle-bound",
    description: "Makes it easier to enter a Hyper-powered State"
  });
  gAbilities.push({
    id: 481,
    name: "Mutekatsu-ryu mystery (Exuberance + Stone Wall)",
    description: "When physical strength is maximum, increased damage, damage received is reduced"
  });
  gAbilities.push({
    id: 482,
    name: "Naoe Letter (Stoutness + Skill usage increase Unity gauge)",
    description: "no longer become Yabuyoroi state, when you use the Tamafuri, united front gauge increases."
  });
  gAbilities.push({
    id: 483,
    name: "National pilgrimage (Warp+ (Flight) + Restart)",
    description: "moving distance of the reduced area is extended.  In addition when the effect of Tamafuri has expired, rarely it becomes ready-to-use.  Aratamafuri, Nigitamafuri is excluded."
  });
  gAbilities.push({
    id: 484,
    name: "No Retreat (Agitation + Fortitude)",
    description: "Attack speed of HyakuRetsukobushi rises. In addition during the immovable stance damage is reduced to receive, energy consumption is also reduced."
  });
  gAbilities.push({
    id: 485,
    name: "Nobunaga's Ambition (Destroyers always Critical Hit + Insight)",
    description: "an increase in damage in the demon torn, must always be a satisfaction."
  });
  gAbilities.push({
    id: 486,
    name: "Obstinacy of the gentleman thief (Desperation + Rebirth)",
    description: "when it is dying, increased damage, weapon gauge the amount is increased."
  });
  gAbilities.push({
    id: 487,
    name: "One's Duality (Random+ (ATK Style) + Random+ (DEF Style))",
    description: "Makes it easier to trigger an ATK or DEF Skill when using Random."
  });
  gAbilities.push({
    id: 488,
    name: "Oni Burial+ (Blessing)",
    description: "When using Oni Burials a random number of stocks for each Weapon Skill will be restored"
  });
  gAbilities.push({
    id: 489,
    name: "Oni Burial+ (Destroy)",
    description: "Damage is increased for Oni Burials"
  });
  gAbilities.push({
    id: 490,
    name: "Oni Burial+ (Wraith)",
    description: "Fills some of Weapon Gauge when using Oni Burials"
  });
  gAbilities.push({
    id: 491,
    name: "Oni Eater+ (Attributes)",
    description: "Increases the duration when imbueing yourself with Geopulses"
  });
  gAbilities.push({
    id: 492,
    name: "Oni Eater+ (Decline)",
    description: "Reduces an Oni's elemental resistance even further when attacking it with elements obtained by Oni Eater."
  });
  gAbilities.push({
    id: 493,
    name: "Oni Eater+ (Improve)",
    description: "An element of the captured Great attributes in the demon Eating when you are given a weapon, the maximum value of physical strength and energy to rise."
  });
  gAbilities.push({
    id: 494,
    name: "Oni Eater+ (Reduce)",
    description: "Of Geopulse captured by the demon Eating to reduce the use interval."
  });
  gAbilities.push({
    id: 495,
    name: "Oni of the Shogunate (Majesty + Stone Wall)",
    description: "Weapon Gauge gains and Defense are both increased while your Health is at Maximum."
  });
  gAbilities.push({
    id: 496,
    name: "Oni Slayer (Recovery+ (Amplify) + Recovery+ (Destroy))",
    description: "Increases the effectiveness of Recovery, and may restore Recovery stocks after a successful Destroyer attack."
  });
  gAbilities.push({
    id: 497,
    name: "Oni Tangle+ (Accuracy)",
    description: "The first follow up attack from a Hand Grapple will always be a precision strike."
  });
  gAbilities.push({
    id: 498,
    name: "Oni Tangle+ (Qinggong)",
    description: "Hand Grapples will consume less focus"
  });
  gAbilities.push({
    id: 499,
    name: "Oni Throw+ (Accelerate)",
    description: "Shortens skill cooldowns when tripping Oni"
  });
  gAbilities.push({
    id: 500,
    name: "Oni Throw+ (Assist)",
    description: "When tripping Oni, fill some of the Unity Gauge to yourself and nearby allies"
  });
  gAbilities.push({
    id: 501,
    name: "Oni Throw+ (Taunt)",
    description: "Draws the Oni's attention when using Demon Hand, and increases the amount the Unity Gauge rises by after an Oni Throw."
  });
  gAbilities.push({
    id: 502,
    name: "Oni's Bane (Restoration + Focus Consumption Reduced)",
    description: "Focus Recovery Speed is increased and Focus Consumption costs are reduced."
  });
  gAbilities.push({
    id: 503,
    name: "Oniwako (Vigor (Increase) + Vigor (Nimble))",
    description: "Vigor has more uses and your Attack Speed is increased during Vigor."
  });
  gAbilities.push({
    id: 504,
    name: "Onslaught (Reduce)",
    description: "Reduce the cooldown of Onslaught ability."
  });
  gAbilities.push({
    id: 505,
    name: "Onslaught (Time)",
    description: "Increases the duration of Onslaught ability."
  });
  gAbilities.push({
    id: 506,
    name: "Onslaught+ (Amplify)",
    description: "During Onslaught, Proportion to convert the defense force to attack force increases."
  });
  gAbilities.push({
    id: 507,
    name: "Onslaught+ (Attributes)",
    description: "Increases Elemental damage when Onslaught is active"
  });
  gAbilities.push({
    id: 508,
    name: "Onslaught+ (Orthodox)",
    description: "Increases the damage you inflict when attacking an Oni from the Front when using Onslaught."
  });
  gAbilities.push({
    id: 509,
    name: "Onslaught+ (Qinggong)",
    description: "Focus consumption is reduced while Onslaught ability is active."
  });
  gAbilities.push({
    id: 510,
    name: "Onslaught+ (Shred)",
    description: "Extends the duration of Onslaught after a successful Destroyer attack."
  });
  gAbilities.push({
    id: 511,
    name: "Open Borders (Dissection (Health) + Swordsmanship)",
    description: "If you destroy or site defeat the 'demon', physical strength is restored, when the satisfaction occurs, weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 512,
    name: "Overcoming the Times (Dissection (Health) + Purification (Health))",
    description: "When you clean the 'demon' and site at the demon exorcism, physical strength is restored"
  });
  gAbilities.push({
    id: 513,
    name: "Panacea (Increase)",
    description: "Number of uses of Panacea is increased."
  });
  gAbilities.push({
    id: 514,
    name: "Panacea (Reduce)",
    description: "Shortens cooldown for Panacea"
  });
  gAbilities.push({
    id: 515,
    name: "Panacea+ (Assist)",
    description: "Further increases Unity gauge gained when using Panacea"
  });
  gAbilities.push({
    id: 516,
    name: "Panacea+ (Destroy)",
    description: "Connecting a Destroyer may restore Panacea stocks"
  });
  gAbilities.push({
    id: 517,
    name: "Panacea+ (Protect)",
    description: "Using Panacea will give everyone including yourself a full Defense gauge"
  });
  gAbilities.push({
    id: 518,
    name: "Panacea+ (Quicken)",
    description: "Pancea  will shorten cooldowns for all players in the area"
  });
  gAbilities.push({
    id: 519,
    name: "Paradox (Increase)",
    description: "Number of uses of Paradox is increased"
  });
  gAbilities.push({
    id: 520,
    name: "Paradox (Reduce)",
    description: "Reduces the cooldown time on Paradox."
  });
  gAbilities.push({
    id: 521,
    name: "Paradox (Time)",
    description: "Increases duration of Paradox."
  });
  gAbilities.push({
    id: 522,
    name: "Paradox+ (Assist)",
    description: "Fill Unity gauge faster when attacking Oni hit by Paradox"
  });
  gAbilities.push({
    id: 523,
    name: "Paradox+ (Attract)",
    description: "Using Paradox will attract body parts to you."
  });
  gAbilities.push({
    id: 524,
    name: "Paradox+ (Bolster)",
    description: "Increases the damage dealt by Paradox."
  });
  gAbilities.push({
    id: 525,
    name: "Paradox+ (Brawn)",
    description: "Gives you the advantage when shoving against an Oni who has been hit by Paradox"
  });
  gAbilities.push({
    id: 526,
    name: "Paradox+ (Destroy)",
    description: "Connecting a Destroyer while a SPC Mitama is equipped to your Weapon has a chance to give an extra charge of Paradox."
  });
  gAbilities.push({
    id: 527,
    name: "Paradox+ (Link)",
    description: "Adds the effects of Sanctum when using Paradox"
  });
  gAbilities.push({
    id: 528,
    name: "Paradox+ (Restrain)",
    description: "Slows down enemy movement when they are hit with Paradox"
  });
  gAbilities.push({
    id: 529,
    name: "Paradox+ (Surprise)",
    description: "Adds the status ailment attributes of your weapon to any Paradox attack"
  });
  gAbilities.push({
    id: 530,
    name: "Perfecting the Sword (Fitness + Frontal Assault)",
    description: "Attack Power, Defense Power, and Maximum Health are all increased. Also you deal additional damage when attacking from the Front."
  });
  gAbilities.push({
    id: 531,
    name: "Perseverance",
    description: "Provides more time to be rescued when KO'd"
  });
  gAbilities.push({
    id: 532,
    name: "Persistence",
    description: "Damage received is reduced while your Health is low."
  });
  gAbilities.push({
    id: 533,
    name: "Phantom of beauty (Dissection (Health) + Oni Throw+ (Quicken))",
    description: "Recover some Health when defeating Oni or breaking Body Parts. Also reduce the cooldown on Weapon Mitama abilities when Tripping Oni"
  });
  gAbilities.push({
    id: 534,
    name: "Phoenix (Reduce)",
    description: "Reduces the Skill cooldown time for Phoenix."
  });
  gAbilities.push({
    id: 535,
    name: "Phoenix (Time)",
    description: "Increases duration of Phoenix."
  });
  gAbilities.push({
    id: 536,
    name: "Phoenix+ (Amplify)",
    description: "Increases healing effect of Phoenix"
  });
  gAbilities.push({
    id: 537,
    name: "Phoenix+ (Bulwark)",
    description: "During Phoenix, defense force and all of the Great attribute defense force is increased"
  });
  gAbilities.push({
    id: 538,
    name: "Phoenix+ (Quicken)",
    description: "Reduces Skill cooldown times when using Phoenix."
  });
  gAbilities.push({
    id: 539,
    name: "Phoenix+ (React)",
    description: "Activates Phoenix when receiving damage."
  });
  gAbilities.push({
    id: 540,
    name: "Phoenix+ (Swift)",
    description: "Increases movment speed when Phoenix is active"
  });
  gAbilities.push({
    id: 541,
    name: "Piety",
    description: "Strengthens the effect of your Ritual of Purification."
  });
  gAbilities.push({
    id: 542,
    name: "Pinnacle of Might (Barrier (Time) + Barrier+ (Link))",
    description: "Increases the duration of Barrier and also gives the effect of Taunt & Shield when activated."
  });
  gAbilities.push({
    id: 543,
    name: "PLN Master (Amplify)",
    description: "Further increases the attack buff for breaking parts while a PLN mitama is equipped to the weapon."
  });
  gAbilities.push({
    id: 544,
    name: "PLN Master (Extend)",
    description: "Further increases the duration of the attack buff for breaking parts while a PLN mitama is equipped to the weapon."
  });
  gAbilities.push({
    id: 545,
    name: "PLN Master (Purify)",
    description: "Purifying body parts while playing PLN will extend the duration of the Passive attack buff"
  });
  gAbilities.push({
    id: 546,
    name: "Police Force (Verity + Wrath)",
    description: "satisfaction force is rising, when it becomes moribund, further effect is increased"
  });
  gAbilities.push({
    id: 547,
    name: "Powerful Archer (Fervor + Wrath)",
    description: "When the satisfaction occurs, energy is restored in response to the damage done, when it is dying, satisfaction is likely to occur."
  });
  gAbilities.push({
    id: 548,
    name: "Precision Strikes (SPT skill lock-on location always on & deals more damage there.)",
    description: "While equip with a Spirit Mitama in your Weapon, the Soul Gauge lock-on is always visble. You deal increased damage to the targeted location."
  });
  gAbilities.push({
    id: 549,
    name: "Preparedness of self-determination (Pursuit (Reduce) + Pursuit+ (Raid))",
    description: "Reduces the Cooldown on Pursuit. Also Pursuit always deals full damage regardless of the Soul Gauges current charge level."
  });
  gAbilities.push({
    id: 550,
    name: "Prescience",
    description: "Reduces concentration time for charge attacks."
  });
  gAbilities.push({
    id: 551,
    name: "Prince of the East (Elemental + Exuberance)",
    description: "Great attribute attack power is increased, when the strength is maximum, damage is increased."
  });
  gAbilities.push({
    id: 552,
    name: "Prince's Expedition (Chain + Oni Eater+ (Attributes))",
    description: "to be able to use in the middle Tamafuri of the attack, the effect size is increased to impart an element of the captured Great attributes in the demon Eating a weapon."
  });
  gAbilities.push({
    id: 553,
    name: "Protection of Heroes",
    description: "In rare cases using a skill will not take away from its stock count"
  });
  gAbilities.push({
    id: 554,
    name: "Protection",
    description: "Increases Defense."
  });
  gAbilities.push({
    id: 555,
    name: "Protection of Ikaruga (Follower (Reduce) + Follower+ (Damage))",
    description: "To reduce the use interval of Osamushu s.  In addition, Misao demon of Osamushu ed in demon exorcism, made to carry out the attack in the vicinity of the demon"
  });
  gAbilities.push({
    id: 556,
    name: "Providence (Reduce)",
    description: "Reduce the cooldown on Providence."
  });
  gAbilities.push({
    id: 557,
    name: "Providence+ (ATK Mode)",
    description: "If Providence triggers Luminescence skill, Carnage will also trigger"
  });
  gAbilities.push({
    id: 558,
    name: "Providence+ (CON Mode)",
    description: "If Providence triggers  Disciple skill, Bastion will also trigger"
  });
  gAbilities.push({
    id: 559,
    name: "Providence+ (DCT Mode)",
    description: "If Providence triggers Contagion skill, Stupor will also trigger"
  });
  gAbilities.push({
    id: 560,
    name: "Providence+ (DEF Mode)",
    description: "If Providence triggers Onslaught skill, Barrier will also trigger"
  });
  gAbilities.push({
    id: 561,
    name: "Providence+ (HLG Mode)",
    description: "If Providence triggers Exertion skill, Panacea will also trigger"
  });
  gAbilities.push({
    id: 562,
    name: "Providence+ (PLN Mode)",
    description: "If Providence triggers Heaven's Wrath skill, Intensity will also trigger"
  });
  gAbilities.push({
    id: 563,
    name: "Providence+ (SPC Mode)",
    description: "If Providence triggers Vortex skill, Paradox will also trigger"
  });
  gAbilities.push({
    id: 564,
    name: "Providence+ (SPD Mode)",
    description: "If Providence triggers Mirage skill, Vigor will also trigger"
  });
  gAbilities.push({
    id: 565,
    name: "Providence+ (SPT Mode)",
    description: "If Providence triggers Illumination skill, Eruption will also trigger"
  });
  gAbilities.push({
    id: 566,
    name: "Providence+ (SUP Mode)",
    description: "If Providence triggers Quicksilver skill, Sacrifice will also trigger"
  });
  gAbilities.push({
    id: 567,
    name: "Puncture (Increase)",
    description: "Number of uses of Puncture is increased."
  });
  gAbilities.push({
    id: 568,
    name: "Puncture (Reduce)",
    description: "Reduce the cooldown on Puncture."
  });
  gAbilities.push({
    id: 569,
    name: "Puncture (Time)",
    description: "Increases the duration of Puncture."
  });
  gAbilities.push({
    id: 570,
    name: "Puncture+ (Absorb)",
    description: "Restores Focus depending on how many parts are hit when you use Puncture"
  });
  gAbilities.push({
    id: 571,
    name: "Puncture+ (Accuracy)",
    description: "Increases precision when attacking parts weakned by Puncture"
  });
  gAbilities.push({
    id: 572,
    name: "Puncture+ (Amplify)",
    description: "Further reduces defense of Oni Parts affected by Puncture."
  });
  gAbilities.push({
    id: 573,
    name: "Puncture+ (Attributes)",
    description: "Elemental Damage is increased against Parts weakened by Puncture."
  });
  gAbilities.push({
    id: 574,
    name: "Puncture+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Deceit Mitama equipped to your Weapon there is a chance to gain an extra charge of Puncture."
  });
  gAbilities.push({
    id: 575,
    name: "Puncture+ (Shoot)",
    description: "Puncture's Needle Ball will continue to move forward"
  });
  gAbilities.push({
    id: 576,
    name: "Puncture+ (Surprise)",
    description: "Status Ailment Power is increased against Parts weakened by Puncture."
  });
  gAbilities.push({
    id: 577,
    name: "Purging Corruption (Devastation + Exploit (Rage))",
    description: "Damage is increased to give in satisfaction.  Further damage is increased to be supplied to the 'demon' in the abnormal state"
  });
  gAbilities.push({
    id: 578,
    name: "Purity (Reduce)",
    description: "Reduce the cooldown on Purify ability."
  });
  gAbilities.push({
    id: 579,
    name: "Purity (Time)",
    description: "To prolong the effect time of Purify."
  });
  gAbilities.push({
    id: 580,
    name: "Purity+ (Assist)",
    description: "During Purification with Purify active. Unity gauge gains are increased for anyone in its effect."
  });
  gAbilities.push({
    id: 581,
    name: "Purity+ (Damage)",
    description: "During Purification with Purify active. Inflict damage by creating explosive spheres when Oni touch your Purification field."
  });
  gAbilities.push({
    id: 582,
    name: "Purity+ (Purify)",
    description: "Large direct 毘中, and to purify the demon and the site at the demon exorcism, to shorten the Tamafuri use interval."
  });
  gAbilities.push({
    id: 583,
    name: "Purity+ (Sanctity)",
    description: "During Purification with Purify active. Purification effect is increased for anyone in its effect."
  });
  gAbilities.push({
    id: 584,
    name: "Purity+ (Sturdy)",
    description: "During Purification with Purify active. Everyone in range of the Purification field will take less damage."
  });
  gAbilities.push({
    id: 585,
    name: "Pursuit (Increase)",
    description: "Number of uses of Pursuit is increased."
  });
  gAbilities.push({
    id: 586,
    name: "Pursuit (Reduce)",
    description: "Reduce the cooldown of Pursuit"
  });
  gAbilities.push({
    id: 587,
    name: "Pursuit+ (Absorb)",
    description: "Restores Focus after hitting an enemy when using Pursuit."
  });
  gAbilities.push({
    id: 588,
    name: "Pursuit+ (Accuracy)",
    description: "Pursuit has a chance to inflict Precision Damage."
  });
  gAbilities.push({
    id: 589,
    name: "Pursuit+ (Bolster)",
    description: "Increases the damage dealt by Pursuit."
  });
  gAbilities.push({
    id: 590,
    name: "Pursuit+ (Devour)",
    description: "Replenishes Soul Gauge when Pursuit hits an enemy."
  });
  gAbilities.push({
    id: 591,
    name: "Pursuit+ (Leech)",
    description: "Recover Health when dealing damage with Pursuit."
  });
  gAbilities.push({
    id: 592,
    name: "Pursuit+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Spirit Mitama equipped to your Weapon there is a chance to gain an extra charge of Pursuit."
  });
  gAbilities.push({
    id: 593,
    name: "Pursuit+ (Raid)",
    description: "Pursuit always deals max damage regardless of the Soul Gauges current charge level."
  });
  gAbilities.push({
    id: 594,
    name: "Pursuit+ (Surprise)",
    description: "Ability inflicts status ailment damage based on users weapon."
  });
  gAbilities.push({
    id: 595,
    name: "Pursuit+ (Track)",
    description: "Improves Pursuit's homing capabilities"
  });
  gAbilities.push({
    id: 596,
    name: "Put Your Mind to It (Exigency + Rebirth)",
    description: "when it is dying, the movement speed is increased, weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 597,
    name: "Quick-witted serving confidant (All Skills+ (Surprise))",
    description: "some to grant state abnormal attribute of weapons to Tamafuri to carry out an attack."
  });
  gAbilities.push({
    id: 598,
    name: "Quicksilver (Reduce)",
    description: "Reduce the cooldown on Quicksilver."
  });
  gAbilities.push({
    id: 599,
    name: "Quicksilver (Time)",
    description: "Increases duration of Quicksilver."
  });
  gAbilities.push({
    id: 600,
    name: "Quicksilver+ (Absorb)",
    description: "Recover Focus by dealing damage while Quicksilver is active."
  });
  gAbilities.push({
    id: 601,
    name: "Quicksilver+ (Accuracy)",
    description: "During Quicksilver, satisfaction is likely to occur."
  });
  gAbilities.push({
    id: 602,
    name: "Quicksilver+ (Amplify)",
    description: "During Quicksilver, A united front gauge increased amount is increased"
  });
  gAbilities.push({
    id: 603,
    name: "Quicksilver+ (Frantic)",
    description: "Treats your status as near death when using Quicksilver"
  });
  gAbilities.push({
    id: 604,
    name: "Quicksilver+ (Nimble)",
    description: "Attack Speed is further increased while Quicksilver is active."
  });
  gAbilities.push({
    id: 605,
    name: "Quicksilver+ (Recover)",
    description: "During Quicksilver, Recovers health of allies within range depending on the damage you do."
  });
  gAbilities.push({
    id: 606,
    name: "Quicksilver+ (Wraith)",
    description: "During Quicksilver, Weapon gauge increased amount is increased"
  });
  gAbilities.push({
    id: 607,
    name: "Random (Increase)",
    description: "Number of uses of Random is increased."
  });
  gAbilities.push({
    id: 608,
    name: "Random (Reduce)",
    description: "Reduce the cooldown on Random."
  });
  gAbilities.push({
    id: 609,
    name: "Random+ (ATK Style)",
    description: "Increases chances of triggering a ATK style skill when using Random"
  });
  gAbilities.push({
    id: 610,
    name: "Random+ (Cautious)",
    description: "Decreases the chance of getting a powerful ability or blank when using Random."
  });
  gAbilities.push({
    id: 611,
    name: "Random+ (CON Style)",
    description: "Increases chances of triggering a CON style skill when using Random"
  });
  gAbilities.push({
    id: 612,
    name: "Random+ (DCT Style)",
    description: "Increases the chance of performing a DCT ability when using Random."
  });
  gAbilities.push({
    id: 613,
    name: "Random+ (DEF Style)",
    description: "Increases chances of triggering a DEF style skill when using Random"
  });
  gAbilities.push({
    id: 614,
    name: "Random+ (Gambler)",
    description: "Increases the chance of getting a powerful ability or blank when using Random."
  });
  gAbilities.push({
    id: 615,
    name: "Random+ (HLG Style)",
    description: "Increases chances of triggering a HLG style skill when using Random"
  });
  gAbilities.push({
    id: 616,
    name: "Random+ (PLN Style)",
    description: "Increases chances of triggering a PLN style skill when using Random"
  });
  gAbilities.push({
    id: 617,
    name: "Random+ (SPC Style)",
    description: "Increases the chance of performing a SPC ability when using Random."
  });
  gAbilities.push({
    id: 618,
    name: "Random+ (SPD Style)",
    description: "Increases chances of triggering a DCT style skill when using Random"
  });
  gAbilities.push({
    id: 619,
    name: "Random+ (SPT Style)",
    description: "Increases chances of triggering a SPT style skill when using Random"
  });
  gAbilities.push({
    id: 620,
    name: "Random+ (SUP Style)",
    description: "Increases chances of triggering a SUP style skill when using Random"
  });
  gAbilities.push({
    id: 621,
    name: "Random+ (Ward)",
    description: "Removes the chance of firing a blank if you defeat an oni or break a part beforehand"
  });
  gAbilities.push({
    id: 622,
    name: "Rapture",
    description: "Increases the amount the Unity Gauge rises by when your Health is at max."
  });
  gAbilities.push({
    id: 623,
    name: "Readiness",
    description: "Increases movement speed when firing regular shots. (Attack speed when aiming is also increased as of v1.03)"
  });
  gAbilities.push({
    id: 624,
    name: "Ready for Battle (Exuberance + Ebullience)",
    description: "Deal more damage when your health is at max. Also deal more damage when your focus is at max"
  });
  gAbilities.push({
    id: 625,
    name: "Ready for Death (Charity + Prescience)",
    description: "Unity Gauge gains are increased. Also reduces concentration time for charge attacks."
  });
  gAbilities.push({
    id: 626,
    name: "Real than name (Extinguishment, Skill usage adds Weapon Gauge)",
    description: "Protects the user from being burned. Also when activating Weapon Mitama abilities gain Weapon Gauge points."
  });
  gAbilities.push({
    id: 627,
    name: "Rebirth",
    description: "Weapon Gauge gains are increased while your Health is low."
  });
  gAbilities.push({
    id: 628,
    name: "Reciting surgery (CON Master (Extend)+)",
    description: "When the demon exorcism, to extend the concrete time of Kuoni.  Katashiro s, including the Kuoni which has been embody in Golay Myojin."
  });
  gAbilities.push({
    id: 629,
    name: "Recovery (Increase)",
    description: "Number of uses of Recovery is increased."
  });
  gAbilities.push({
    id: 630,
    name: "Recovery+ (Amplify)",
    description: "Increases the amount of health restored from Recovery."
  });
  gAbilities.push({
    id: 631,
    name: "Recovery+ (Blessing)",
    description: "When you use Recovery you have a chance to fully recover health."
  });
  gAbilities.push({
    id: 632,
    name: "Recovery+ (Bonus)",
    description: "Recovers focus in addition to health when using Recovery."
  });
  gAbilities.push({
    id: 633,
    name: "Recovery+ (Destroy)",
    description: "Connecting a Destroyer may restore a Recovery stock"
  });
  gAbilities.push({
    id: 634,
    name: "Recovery+ (Heal)",
    description: "Recovery heals status ailments to yourself and to nearby allies."
  });
  gAbilities.push({
    id: 635,
    name: "Recovery+ (Purify)",
    description: "After purifying an Oni or Body Part, there is a chance to gain an extra charge of Recovery."
  });
  gAbilities.push({
    id: 636,
    name: "Recovery+ (Range)",
    description: "Enables nearby allies to also receive the benefits of your Recovery"
  });
  gAbilities.push({
    id: 637,
    name: "Red Demon of Li (Precision strikes increase Ailment chance)",
    description: "State abnormal damage is increased to give in satisfaction"
  });
  gAbilities.push({
    id: 638,
    name: "Relaxation",
    description: "Restore a larger amount of health when you are rescued from a KO"
  });
  gAbilities.push({
    id: 639,
    name: "Relentless",
    description: "When you attack a site at which the Kuna are stuck, further increase the damage."
  });
  gAbilities.push({
    id: 640,
    name: "Reload",
    description: "Increases Rifle's Magazine Size"
  });
  gAbilities.push({
    id: 641,
    name: "Reloading Speed+",
    description: "Increases Reloading Speed."
  });
  gAbilities.push({
    id: 642,
    name: "Renewal",
    description: "Increases the amount of the Health Gauge that turns red after taking damage."
  });
  gAbilities.push({
    id: 643,
    name: "Resillience",
    description: "Prevents you from being stunned."
  });
  gAbilities.push({
    id: 644,
    name: "Resolute Behavior (Focus Consumption Reduced + Prescience)",
    description: "energy consumption is reduced, to reduce the reservoir time of reservoir attack."
  });
  gAbilities.push({
    id: 645,
    name: "Restart",
    description: "When a Mitama skill expires, in rare cases it will be instantly ready to use again. Does not work for Hand and Armor Skills"
  });
  gAbilities.push({
    id: 646,
    name: "Restoration",
    description: "Recovery rate of Focus is increased."
  });
  gAbilities.push({
    id: 647,
    name: "Revival+ (Blessing)",
    description: "Makes it easier to restore skill stocks when using Revival"
  });
  gAbilities.push({
    id: 648,
    name: "Revival+ (Quicken)",
    description: "Reduces cooldowns for all players when using Revival"
  });
  gAbilities.push({
    id: 649,
    name: "Ride of the Valkyrie (Insight + Majesty)",
    description: "increased damage in the demon torn, when physical strength is the maximum, weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 650,
    name: "Sacrifice (Increase)",
    description: "Increases the number of times you can use Sacrifice."
  });
  gAbilities.push({
    id: 651,
    name: "Sacrifice (Reduce)",
    description: "Reduce the cooldown of Sacrifice"
  });
  gAbilities.push({
    id: 652,
    name: "Sacrifice (Time)",
    description: "Increases the duration of Sacrifice."
  });
  gAbilities.push({
    id: 653,
    name: "Sacrifice+ (Amplify)",
    description: "In at the risk of life Kyogi, it effects the amount of ability is increased."
  });
  gAbilities.push({
    id: 654,
    name: "Sacrifice+ (Destroy)",
    description: "Breaking a Body Part while a Support Mitama is equipped to your Weapon has a chance to give an extra charge of Sacrifice."
  });
  gAbilities.push({
    id: 655,
    name: "Sacrifice+ (Leech)",
    description: "Steals Health from Oni that you attack when using Sacrifice."
  });
  gAbilities.push({
    id: 656,
    name: "Sacrifice+ (Link)",
    description: "Adds the effects of Altruism and Diffusion when using Sacrifice"
  });
  gAbilities.push({
    id: 657,
    name: "Sacrifice+ (Minimize)",
    description: "Decreases the amount of health you lose when using Sacrifice."
  });
  gAbilities.push({
    id: 658,
    name: "Sacrifice+ (Rally)",
    description: "Restores the Focus of your allies while attacking Oni when using Sacrifice."
  });
  gAbilities.push({
    id: 659,
    name: "Sacrifice+ (Spirit)",
    description: "Prevents a KO if you have suffiecient health when using Sacrifice"
  });
  gAbilities.push({
    id: 660,
    name: "Saint's March (Raises Attack and Defense to nearby allies)",
    description: "attack and defense of allies within the range is increased."
  });
  gAbilities.push({
    id: 661,
    name: "Sakigakeru is not for the honor (Conviction + Rebirth)",
    description: "When the stamina is there are many, it is no longer possible to run out of steam with a single blow, when they become moribund, weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 662,
    name: "Sanctum (Increase)",
    description: "Number of uses of Sanctum is increased."
  });
  gAbilities.push({
    id: 663,
    name: "Sanctum (Reduce)",
    description: "Reduces the cooldown time on Sanctum."
  });
  gAbilities.push({
    id: 664,
    name: "Sanctum (Time)",
    description: "Increases duration of Sanctum."
  });
  gAbilities.push({
    id: 665,
    name: "Sanctum+ (Accuracy)",
    description: "Increased chance for Precision Strikes while Sanctum is active."
  });
  gAbilities.push({
    id: 666,
    name: "Sanctum+ (Aegis)",
    description: "Regeneration of the red part of your Health Gauge is increased while Sanctum is active."
  });
  gAbilities.push({
    id: 667,
    name: "Sanctum+ (Amplify)",
    description: "Increases effects of Sanctum"
  });
  gAbilities.push({
    id: 668,
    name: "Sanctum+ (Assist)",
    description: "Unity Gauge gains are increased while Sanctum is active."
  });
  gAbilities.push({
    id: 669,
    name: "Sanctum+ (Extend)",
    description: "Extends the length of the cooldown reduction effect given by sanctum"
  });
  gAbilities.push({
    id: 670,
    name: "Sanctum+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Space Mitama equipped to your Weapon there is a chance to gain an extra charge of Sanctum."
  });
  gAbilities.push({
    id: 671,
    name: "Sanctum+ (Quicken)",
    description: "Attacking Oni while Sanctum is active will reduce the cooldowns on all your Weapon Mitama abilities."
  });
  gAbilities.push({
    id: 672,
    name: "Sanctum+ (Swift)",
    description: "Movment Speed is increased while Sanctum is active"
  });
  gAbilities.push({
    id: 673,
    name: "Sculpture of the soul (Tolerance + Kockback resistance to all Charge attacks)",
    description: "all of the Great attribute defense force is increased, during the reservoir time of reservoir attack, it is difficult Nokezori."
  });
  gAbilities.push({
    id: 674,
    name: "Second Coming (Charity + Oni Throw+ (Assist))",
    description: "a united front gauge increased amount is increased.  When a successful return demon, a united front gauge of ally in the range is increased."
  });
  gAbilities.push({
    id: 675,
    name: "Selfless Love",
    description: "Unity Gauge gains are increased while your Health is low."
  });
  gAbilities.push({
    id: 676,
    name: "Sengoku Beauty (Leech+ (Amplify) + Leech+ (Range))",
    description: "Increase the amount of health gained using Leech. Also nearby allies gain the effects of your Leech ability."
  });
  gAbilities.push({
    id: 677,
    name: "Sense of Self-worth (Piety + LCK Master (Revival))",
    description: "Strengthens the effect of your Ritual of Purification. Also to purify the 'demon' and the site, the number of uses of Saiwaitamashi is likely to recover"
  });
  gAbilities.push({
    id: 678,
    name: "Shield (Increase)",
    description: "Number of uses of Shield is increased."
  });
  gAbilities.push({
    id: 679,
    name: "Shield (Reduce)",
    description: "Reduces the Skill cooldown time for Shield."
  });
  gAbilities.push({
    id: 680,
    name: "Shield+ (Link)",
    description: "Adds the effects of Taunt when activating Shield."
  });
  gAbilities.push({
    id: 681,
    name: "Shield+ (Purify)",
    description: "May restore Shield stocks after purifying an Oni or body part while using a DEF Mitama for your weapon."
  });
  gAbilities.push({
    id: 682,
    name: "Shield+ (Range)",
    description: "Enables nearby allies to recieve some of the benefits of Shield."
  });
  gAbilities.push({
    id: 683,
    name: "Shield+ (Valiant)",
    description: "Increases the max size of the Defense Gauge even more when using Shield."
  });
  gAbilities.push({
    id: 684,
    name: "Shinsan Kibo (Charity + Exploit (Assist))",
    description: "a united front gauge increased amount is increased, and to attack the 'demon' in the abnormal state, further effect is increased."
  });
  gAbilities.push({
    id: 685,
    name: "Shinto Munenryu (Chain + Heroes' Rally)",
    description: "Mitama abilities can be activated during attacks. Also when you deal a Precision Strike reduce the Cooldown of your Weapon Mitama abilities."
  });
  gAbilities.push({
    id: 686,
    name: "Sign of Hope (Chain + Fervor)",
    description: "Mitama abilities can be activated during attacks. Also when you deal a Precision Strike restore Focus based on the damage dealt."
  });
  gAbilities.push({
    id: 687,
    name: "Single-minded Devotion (Dissection (Focus) + Majesty)",
    description: "If you destroy or site defeat the 'demon', energy is restored, when the strength is maximum, weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 688,
    name: "Skilled Reformist (Dissection (Focus) + Small focus restored on each strike)",
    description: "Recover some Focus when defeating Oni or breaking Body Parts. Also energy is restored in accordance with the damage done"
  });
  gAbilities.push({
    id: 689,
    name: "Skydriller",
    description: "One 穿中, reservoir time is short, damage is increased."
  });
  gAbilities.push({
    id: 690,
    name: "Solidity (Reduce)",
    description: "Reduces the cooldown time on Solidity ability."
  });
  gAbilities.push({
    id: 691,
    name: "Solidity (Time)",
    description: "Increase the duration of Solidity ability."
  });
  gAbilities.push({
    id: 692,
    name: "Solidity+ (Aegis)",
    description: "Increases recovery of the red part of the health gauge when Solidity skill is active"
  });
  gAbilities.push({
    id: 693,
    name: "Solidity+ (Amplify)",
    description: "Increases the potency of Solidity ability."
  });
  gAbilities.push({
    id: 694,
    name: "Solidity+ (Havoc)",
    description: "Extends the duration of Solidity after defeating an Oni or destroying a body part."
  });
  gAbilities.push({
    id: 695,
    name: "Solidity+ (Resist)",
    description: "Immunity to ailments when Solidity is activated or active"
  });
  gAbilities.push({
    id: 696,
    name: "Sparkle of the moment (Protection of Heroes + Restart)",
    description: "When you use the Tamafuri, rarely use the number of times of no longer reduced, when the effect has expired, rarely become ready-to-use.  Aratamafuri, Nigitamafuri is excluded."
  });
  gAbilities.push({
    id: 697,
    name: "SPC Master (Accuracy)",
    description: "While your Weapon Mitama is SPC, the Purification buff will also increase Precision"
  });
  gAbilities.push({
    id: 698,
    name: "SPC Master (Extend)",
    description: "While your Weapon Mitama is SPC, increases the duration of the Purification buff"
  });
  gAbilities.push({
    id: 699,
    name: "SPC Master (Purify)",
    description: "While your Weapon Mitama is SPC, Purified Body Parts reduces cooldowns"
  });
  gAbilities.push({
    id: 700,
    name: "SPC Master (Quicken)",
    description: "While your Weapon Spirit is SPC, increases the effectiveness of the Purification buff"
  });
  gAbilities.push({
    id: 701,
    name: "SPC Master (Rage)",
    description: "While your Weapon Mitama is SPC, the Purification buff will also increase Attack"
  });
  gAbilities.push({
    id: 702,
    name: "SPD Master (Minimize)",
    description: "Focus Consumption is further reduced while a Speed Mitama is equipped in your weapon."
  });
  gAbilities.push({
    id: 703,
    name: "SPD Master (Special)",
    description: "When the weapon mitama is SPD, Damage in the special techniques increases"
  });
  gAbilities.push({
    id: 704,
    name: "Specimen collection (Moxibustion + Universal HLG Master (Rally))",
    description: "Focus is recovered when detonating the Whip's Kunas. You also Restore Focus to allies when you attack them."
  });
  gAbilities.push({
    id: 705,
    name: "Spin Doctor",
    description: "Decreases the Focus consumption for Dual Knives' Spin"
  });
  gAbilities.push({
    id: 706,
    name: "Spirit of Aizu (Chance + Taunt+ (Zone))",
    description: "Enables you to receive no damage from enemy attacks on occasion. Also Taunt will attract the attention of all oni within range."
  });
  gAbilities.push({
    id: 707,
    name: "Spirit of Forrest Gump (Vitality+ (Amplify) + Vitality+ (Rigid))",
    description: "the effect size of Megaminosha rises, in effect of Megaminosha, hardly Nokezori"
  });
  gAbilities.push({
    id: 708,
    name: "SPT Master (Augment)",
    description: "Soul Gauge increases faster during Purification Stance while a Spirit Mitama is equipped to your Weapon."
  });
  gAbilities.push({
    id: 709,
    name: "SPT Master (Bolster)",
    description: "When Weapon mitama is SPT, SPT skills will deal more damage."
  });
  gAbilities.push({
    id: 710,
    name: "SPT Master (Devote)",
    description: "When a SPT mitama is on your weapon, SPT Skills will become more powerful but take longer to charge"
  });
  gAbilities.push({
    id: 711,
    name: "SPT Master (Havoc)",
    description: "Maximes the charge of your next Weapon Skill after defeating or breaking a part (SPT style)"
  });
  gAbilities.push({
    id: 712,
    name: "SPT Master (Purify)",
    description: "Refills the Spirit Gauge after successfully purifying an Oni's body part (SPT Weapon style)"
  });
  gAbilities.push({
    id: 713,
    name: "SPT Master (Quicken)",
    description: "Reduces Skill cooldown times after inlifcting additional damage via your abilities when using a SPT Mitama for your Weapon."
  });
  gAbilities.push({
    id: 714,
    name: "SPT Master (Renewal)",
    description: "Prevents the Spirit Gauge from depleting while using a SPT Mitama for your Weapon."
  });
  gAbilities.push({
    id: 715,
    name: "SPT Master (Rigid)",
    description: "While in Purifying Stance you cannot be knocked down if a Spirit Mitama is equipped to your Weapon."
  });
  gAbilities.push({
    id: 716,
    name: "Stamina",
    description: "Increases Maximum Health."
  });
  gAbilities.push({
    id: 717,
    name: "Stealth",
    description: "Decreased chance of gaining enemies attention."
  });
  gAbilities.push({
    id: 718,
    name: "Stepford Trophy Wife (HLG Master (Quicken) + HLG Master (Cure))",
    description: "Attacking allies decreases their Weapon Mitamas cooldowns and Restores their Health."
  });
  gAbilities.push({
    id: 719,
    name: "Stone Wall",
    description: "Increases Defense when your Health is at max."
  });
  gAbilities.push({
    id: 720,
    name: "Stoutness",
    description: "Protects the user from having their defense broken."
  });
  gAbilities.push({
    id: 721,
    name: "Strength of a Bear (Oni Throw+ (Damage) + Oni Throw+ (Recover))",
    description: "an increase in damage in return demon, physical strength is restored"
  });
  gAbilities.push({
    id: 722,
    name: "Striker (Increase)",
    description: "Increases the number of  Striker uses."
  });
  gAbilities.push({
    id: 723,
    name: "Striker (Reduce)",
    description: "Reduces the cooldown time on CON's Triangle ability."
  });
  gAbilities.push({
    id: 724,
    name: "Striker (Time)",
    description: "Increases the duration of Striker."
  });
  gAbilities.push({
    id: 725,
    name: "Striker+ (Aegis)",
    description: "Increases the refill rate of the red portion of the Health Gauge while the field made by your Summon Striker pet is active."
  });
  gAbilities.push({
    id: 726,
    name: "Striker+ (Amplify)",
    description: "Increases Striker's Effect"
  });
  gAbilities.push({
    id: 727,
    name: "Striker+ (Augment)",
    description: "Reduces the time it takes Striker to set up"
  });
  gAbilities.push({
    id: 728,
    name: "Striker+ (Bonus)",
    description: "Increases the refill rate of the Focus Gauge while the field made by your Summon Striker pet is active."
  });
  gAbilities.push({
    id: 729,
    name: "Striker+ (Destroy)",
    description: "Breaking a Body Part while a CON Mitama is equipped to your Weapon has a chance to give an extra charge of  Striker."
  });
  gAbilities.push({
    id: 730,
    name: "Striker+ (Purify)",
    description: "Purifying a Body Part while a CON Mitama is equipped to your Weapon has a chance to give an extra charge of  Striker."
  });
  gAbilities.push({
    id: 731,
    name: "Striker+ (Surprise)",
    description: "Increases Ailment stat to anyone in Striker's effect"
  });
  gAbilities.push({
    id: 732,
    name: "Stupor (Increase)",
    description: "Increases stock count of Stupor"
  });
  gAbilities.push({
    id: 733,
    name: "Stupor (Reduce)",
    description: "Reduces cooldown of Stupor"
  });
  gAbilities.push({
    id: 734,
    name: "Stupor (Time)",
    description: "Increases the duration of Stupor."
  });
  gAbilities.push({
    id: 735,
    name: "Stupor+ (Accuracy)",
    description: "Increased chance for Precision Strikes while Oni is trapped by Stupor."
  });
  gAbilities.push({
    id: 736,
    name: "Stupor+ (Destroy)",
    description: "Connecting a Destroyer with a DCT mitama in your weapon slot may restore Stupor stocks"
  });
  gAbilities.push({
    id: 737,
    name: "Subjugation (Amplify)",
    description: "Increases the effect of  Subjugation ability."
  });
  gAbilities.push({
    id: 738,
    name: "Subjugation (Leech)",
    description: "Health is restored when Subjugation hits a target."
  });
  gAbilities.push({
    id: 739,
    name: "Subjugation (Reduce)",
    description: "Reduces the cooldown on Subjugation"
  });
  gAbilities.push({
    id: 740,
    name: "Subjugation+ (Absorb)",
    description: "Focus is restored when Subjugation hits a target."
  });
  gAbilities.push({
    id: 741,
    name: "Subjugation+ (Extend)",
    description: "Extends the duration of your active abilities when Subjugation is active"
  });
  gAbilities.push({
    id: 742,
    name: "Subjugation+ (Heal)",
    description: "Removes ailments when Subjugation activates"
  });
  gAbilities.push({
    id: 743,
    name: "Successor to the Queen (Oni Eater+ (Shred))",
    description: "An element of the captured Great attributes in the demon Eating when you are given a weapon, and hit the demon torn, to prolong the effect time."
  });
  gAbilities.push({
    id: 744,
    name: "SUP Master (Aegis)",
    description: "When the weapon Spirit is SUP and you attack oni, the red part of the health gauge of allies is restored"
  });
  gAbilities.push({
    id: 745,
    name: "SUP Master (Amplify)",
    description: "Increases Weapon gauge distributed to allies (SUP Style)"
  });
  gAbilities.push({
    id: 746,
    name: "Support of Yamato Nadeshiko (Precision strikes heal you + Majesty)",
    description: "when satisfaction has occurred, to recover the physical strength, when physical strength is the maximum, weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 747,
    name: "Surveyance",
    description: "Increases Damage of Homing Arrows, Enables you to select a wider target area"
  });
  gAbilities.push({
    id: 748,
    name: "Swiftness",
    description: "Increased movement speed."
  });
  gAbilities.push({
    id: 749,
    name: "Swordsmanship",
    description: "When a Precision Strike occurs Weapon Gauge gained is increased."
  });
  gAbilities.push({
    id: 750,
    name: "Taunt (Increase)",
    description: "Number of uses of Taunt is increased"
  });
  gAbilities.push({
    id: 751,
    name: "Taunt (Reduce)",
    description: "Reduces Cooldown time of Taunt by half"
  });
  gAbilities.push({
    id: 752,
    name: "Taunt (Time)",
    description: "Extends Duration of Taunt"
  });
  gAbilities.push({
    id: 753,
    name: "Taunt+ (Amity)",
    description: "Gradually restores Health when using Taunt."
  });
  gAbilities.push({
    id: 754,
    name: "Taunt+ (Assist)",
    description: "Increases the amount the Unity guage rises when using Taunt"
  });
  gAbilities.push({
    id: 755,
    name: "Taunt+ (Damage)",
    description: "Increases damage by consuming some of the Defense Gauge with each attack"
  });
  gAbilities.push({
    id: 756,
    name: "Taunt+ (Protect)",
    description: "Replenishes Defense Gauge automatically over time while Taunt is active."
  });
  gAbilities.push({
    id: 757,
    name: "Taunt+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Defense Mitama equipped to your Weapon there is a chance to gain an extra charge of Taunt."
  });
  gAbilities.push({
    id: 758,
    name: "Taunt+ (Sturdy)",
    description: "Increases your Defense even more when using Taunt."
  });
  gAbilities.push({
    id: 759,
    name: "Taunt+ (Swift)",
    description: "Movement Speed is increased while Taunt is active."
  });
  gAbilities.push({
    id: 760,
    name: "Taunt+ (Zone)",
    description: "Extends the range of Taunt"
  });
  gAbilities.push({
    id: 761,
    name: "Tempered Blade",
    description: "Makes it easier to inflict Deep wounds with Gouge. Charge Buff's next attack from Gouge is always deep"
  });
  gAbilities.push({
    id: 762,
    name: "Tenacity",
    description: "Increases the damage you inflict when near death, and decreases the damage you receive."
  });
  gAbilities.push({
    id: 763,
    name: "The Boss's Back (Fortune+ (Extend))",
    description: "When the fortune of fortune is large Daikichi, to prolong the effect time of Tamafuri to strengthen the self-confidence."
  });
  gAbilities.push({
    id: 764,
    name: "The Emperor's Love (Recovery+ (Bonus) + Protection of Heroes)",
    description: "Recover Focus proportional to the Health gained when using the Recovery ability. Sometimes when activating a Weapon Mitama ability a usage will not be expended."
  });
  gAbilities.push({
    id: 765,
    name: "The End is Nigh (Agility+ (Quicken) + Agility+ (Purify))",
    description: "when the effect of Utsusemi has disappeared, to reduce the use interval of Tamafuri, and to purify the 'demon' and site at the demon exorcism, in rare cases the number of uses of Utsusemi is restored."
  });
  gAbilities.push({
    id: 766,
    name: "The Lion King Sword (Devastation + Prescience)",
    description: "Increases damage dealt by Precision Strikes. Also Reduces concentration time for charge attacks."
  });
  gAbilities.push({
    id: 767,
    name: "The Next Generation (Brandish + Swordsmanship)",
    description: "Increased chance for Precision Strikes while your Health is at maximum. Also gain additional Weapon Gauge points when inflicting a Precision Strike."
  });
  gAbilities.push({
    id: 768,
    name: "Thirst for Knowledge (Chain + Skills restore Focus)",
    description: "to be able to use the Tamafuri in the middle of the attack, when you invoke the Tamafuri, energy is restored."
  });
  gAbilities.push({
    id: 769,
    name: "Thoughts of Japan (Stamina + Exertion+ (Amplify))",
    description: "the maximum value of physical strength is increased.  Further shed attack on raw sword students bow in, physical fitness consumption is also increased fixed damage, but to increase."
  });
  gAbilities.push({
    id: 770,
    name: "Three Arrows",
    description: "Increases the amount the Weapon Gauge rises by when using Bow's Quick Nock, String Tension effect increases it further"
  });
  gAbilities.push({
    id: 771,
    name: "Three Cups of Tea (Oni Burial+ (Blessing) + Revival+ (Blessing))",
    description: "When a successful kisou, one of the Tamafuri number of times of use is restored.  When you use the Saiwaitamashi, Tamafuri number of times of use is likely to be recovered."
  });
  gAbilities.push({
    id: 772,
    name: "Three Swords (Chain + Great Ambition)",
    description: "Mitama abilities can be activated during attacks.Furthermore invincible time becomes longer in Dual Knive's Swallow Dive, damage is increased."
  });
  gAbilities.push({
    id: 773,
    name: "Thunderous Shout (Dissection (Health) + Dissection (Focus))",
    description: "If you destroy or site defeat the 'demon', physical strength and energy is restored."
  });
  gAbilities.push({
    id: 774,
    name: "To kill one's boredom (Chain + Rapture)",
    description: "to be able to use in the middle Tamafuri of the attack, when the strength is maximum, a united front gauge increased amount is increased."
  });
  gAbilities.push({
    id: 775,
    name: "Tokugawa Clan (Stamina + Recovery+ (Amplify))",
    description: "an effective amount of the maximum value and the healing of physical strength is increased."
  });
  gAbilities.push({
    id: 776,
    name: "Tolerance",
    description: "Elemental defense power is increased."
  });
  gAbilities.push({
    id: 777,
    name: "Tranquility",
    description: "Greatly increases Defense, but reduces movement speed."
  });
  gAbilities.push({
    id: 778,
    name: "Transposition (Surprise)",
    description: "Ailment chance is increased but regular Attack Power is decreased."
  });
  gAbilities.push({
    id: 779,
    name: "Transposition (Attributes)",
    description: "Elemental Attack Power is increased but regular Attack Power is decreased."
  });
  gAbilities.push({
    id: 780,
    name: "Turbulent demon (Increases Duration of Any Claw Skill)",
    description: "to strengthen itself to prolong the effect time of Aratamafuri"
  });
  gAbilities.push({
    id: 781,
    name: "Uncommon Accuracy (Heaven's Wrath+ (Bonus) + Heaven's Wrath+ (Quicken))",
    description: "Amaha people Kinaka, energy is restored in accordance with the physical strength to decrease gradually, to reduce the Tamafuri use interval."
  });
  gAbilities.push({
    id: 782,
    name: "Unfinished Dreams (Mitama Pulse + Expert Destroyer)",
    description: "Increases the damage you inflict against Miasmal nodes with a Gun. Also gain additional Weapon Gauge points by attacking Oni."
  });
  gAbilities.push({
    id: 783,
    name: "Unfortunate Daughter (Purification (Wraith))",
    description: "When you clean the 'demon' and site at the demon exorcism, weapon gauge increases"
  });
  gAbilities.push({
    id: 784,
    name: "Unlimited Potential (Brandish + Rapture)",
    description: "When physical strength is the maximum, weapon gauge increase the amount of the united front gauge increased amount is increased."
  });
  gAbilities.push({
    id: 785,
    name: "Unparalleled ambition (Exploit (Accuracy) + Heroe's Rally)",
    description: "When you attack the 'demon' of the abnormal state in, satisfaction is likely to occur, and satisfaction occurs, Tamafuri use interval is shortened."
  });
  gAbilities.push({
    id: 786,
    name: "Unparalleled Beauty (Sacrifice+ (Zone) + Divinity)",
    description: "to expand the range desperate Kyogi, recovery speed of the red part of the stamina gauge rises"
  });
  gAbilities.push({
    id: 787,
    name: "Unparalleled Spearwork (Lightspeed Thrust + Rush+ (Wraith))",
    description: "Attack speed and Retsuchiri突weapon gauge increased amount is increased."
  });
  gAbilities.push({
    id: 788,
    name: "Unwavering Ambition (Dissection (Quicken) + Perseverance)",
    description: "shed demon torn, to shorten the Tamafuri use interval.  Further withdrawal speed is slow."
  });
  gAbilities.push({
    id: 789,
    name: "Unwavering Faith (Verity + Swordsmanship)",
    description: "Increases critical attack bonus,Increases the amount of points the Weapon Gauge gains from precision strikes."
  });
  gAbilities.push({
    id: 790,
    name: "Vanishing mist",
    description: "In the hazy moon, focus consumption is reduced. Attack speed is increased"
  });
  gAbilities.push({
    id: 791,
    name: "Vengeance for Father (Knowledge (Leech) + Knowledge (Absorb))",
    description: "physical strength and energy is restored in accordance with the damage dealt by the Great attribute attack."
  });
  gAbilities.push({
    id: 792,
    name: "Verity",
    description: "Increased chance for Precision Strikes."
  });
  gAbilities.push({
    id: 793,
    name: "Vice-Shogun's Power (Warp+ (CON Teleport) + All CON Skills+ (Attributes))",
    description: "Increases Elemental Damage for all CON Skills. When using SPC's Warp, you will warp to the nearest CON Spirit"
  });
  gAbilities.push({
    id: 794,
    name: "Vigor (Increase)",
    description: "Increases the number of times you can use Vigor"
  });
  gAbilities.push({
    id: 795,
    name: "Vigor (Reduce)",
    description: "Shortens cooldown for Vigor"
  });
  gAbilities.push({
    id: 796,
    name: "Vigor (Time)",
    description: "Increases the duration of Vigor."
  });
  gAbilities.push({
    id: 797,
    name: "Vigor+ (Assist)",
    description: "Unity Gauge gains are increased while Vigor is active."
  });
  gAbilities.push({
    id: 798,
    name: "Vigor+ (Destroy)",
    description: "Connecting a Destroyer may restore Vigor stocks"
  });
  gAbilities.push({
    id: 799,
    name: "Vigor+ (Link)",
    description: "Adds the effects of Agility and Energy when activating Vigor."
  });
  gAbilities.push({
    id: 800,
    name: "Vigor+ (Nimble)",
    description: "Attack speed is further increased while Vigor is active."
  });
  gAbilities.push({
    id: 801,
    name: "Vigor+ (Rigid)",
    description: "Makes it harder to be knocked back when Vigor is active"
  });
  gAbilities.push({
    id: 802,
    name: "Vigor+ (Sneak)",
    description: "Oni are less likely to focus their attention on you while Vigor is active."
  });
  gAbilities.push({
    id: 803,
    name: "Vigor+ (Special)",
    description: "Increases damage of special techniques while Vigor is active."
  });
  gAbilities.push({
    id: 804,
    name: "Vigor+ (Wraith)",
    description: "Weapon Gauge points gained are increased while Vigor is active."
  });
  gAbilities.push({
    id: 805,
    name: "Vitality (Increase)",
    description: "Number of uses of Vitality is increased."
  });
  gAbilities.push({
    id: 806,
    name: "Vitality (Reduce)",
    description: "Reduces cooldown of Vitality"
  });
  gAbilities.push({
    id: 807,
    name: "Vitality (Time)",
    description: "Increases the duration of Vitality."
  });
  gAbilities.push({
    id: 808,
    name: "Vitality+ (Amplify)",
    description: "Increases Vitality's healing effect"
  });
  gAbilities.push({
    id: 809,
    name: "Vitality+ (Assist)",
    description: "Unity Gauge gains are increased while Vitality is active."
  });
  gAbilities.push({
    id: 810,
    name: "Vitality+ (Bulwark)",
    description: "Increases Elemental defense when in Vitaltiy's effect"
  });
  gAbilities.push({
    id: 811,
    name: "Vitality+ (Heal)",
    description: "Vitality will remove ailments"
  });
  gAbilities.push({
    id: 812,
    name: "Vitality+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Healing Mitama equipped to your Weapon there is a chance to gain an extra charge of Vitality."
  });
  gAbilities.push({
    id: 813,
    name: "Vitality+ (Rigid)",
    description: "Makes it harder to be knocked back when in Vitality's effect"
  });
  gAbilities.push({
    id: 814,
    name: "Vitality+ (Sturdy)",
    description: "Being in Vitality's range will increase Defense"
  });
  gAbilities.push({
    id: 815,
    name: "Vitality+ (Zone)",
    description: "Increases the area of effect size of Vitality."
  });
  gAbilities.push({
    id: 816,
    name: "Vortex (Reduce)",
    description: "Reduce the cooldown on Vortex ability."
  });
  gAbilities.push({
    id: 817,
    name: "Vortex+ (Accuracy)",
    description: "Vortex Ability has a chance to inflict Precision damage."
  });
  gAbilities.push({
    id: 818,
    name: "Vortex+ (Attract)",
    description: "Vortex will pull in oni"
  });
  gAbilities.push({
    id: 819,
    name: "Vortex+ (Bolster)",
    description: "Increases the damage dealt by Vortex ability."
  });
  gAbilities.push({
    id: 820,
    name: "Vortex+ (Compress)",
    description: "Shortens the time it takes for Vortex to detonate"
  });
  gAbilities.push({
    id: 821,
    name: "Vortex+ (Exploit)",
    description: "Increases damage against Oni suffering from ailments when using Vortex"
  });
  gAbilities.push({
    id: 822,
    name: "Vortex+ (Surprise)",
    description: "Ability inflicts status ailment damage based on users weapon."
  });
  gAbilities.push({
    id: 823,
    name: "Wandering Thoughts (Illusion+ (Swift) + Illusion+ (Purify))",
    description: "in Komokatachi, movement speed is increased, and to purify the 'demon' and site at the demon exorcism, in rare cases the number of uses of Komokatachi is restored."
  });
  gAbilities.push({
    id: 824,
    name: "War Fan of Victory (Your Damage up on Oni hit by Bolster)",
    description: "Damage is increased to give the void Roh rests on the jaw 'demon'."
  });
  gAbilities.push({
    id: 825,
    name: "Warm Sunlight (Exuberance + Majesty)",
    description: "When physical strength is the maximum, is damage to the weapon gauge increase the amount of increase."
  });
  gAbilities.push({
    id: 826,
    name: "Warmth",
    description: "Protects you from the Frozen ailment."
  });
  gAbilities.push({
    id: 827,
    name: "Warp (Increase)",
    description: "Number of uses of Warp is increased."
  });
  gAbilities.push({
    id: 828,
    name: "Warp (Reduce)",
    description: "Reduce the cooldown on Warp."
  });
  gAbilities.push({
    id: 829,
    name: "Warp+ (Accuracy)",
    description: "After using Warp, your next attack will always be a Precision Strike."
  });
  gAbilities.push({
    id: 830,
    name: "Warp+ (Bonus)",
    description: "Restore Focus when you use Warp."
  });
  gAbilities.push({
    id: 831,
    name: "Warp+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Space Mitama equipped to your Weapon there is a chance to gain an extra charge of Warp."
  });
  gAbilities.push({
    id: 832,
    name: "Warp+ (Reverse)",
    description: "Makes you travel backwards when using Warp"
  });
  gAbilities.push({
    id: 833,
    name: "Warp+ (Teleport)",
    description: "Using Warp teleports you to your closest Sanctum Circle."
  });
  gAbilities.push({
    id: 834,
    name: "Warrior Maiden (Dissection (Wraith))",
    description: "Increases the Weapon Gauge when defeating Oni, or breaking their body parts."
  });
  gAbilities.push({
    id: 835,
    name: "Watered down (Follower becomes Poison, makes Geopulse when done)",
    description: "the poison attribute grants to Kuoni, which is embodied in Osamushu s, when the effect has expired, Kuoni is to generate a Geopulse of poison."
  });
  gAbilities.push({
    id: 836,
    name: "Way of the Demon (Striker (Time), Camp will lower Oni's Elemental Def.)",
    description: "to prolong the effect time of Mamoru species s, in demon exorcism also Kuoni is to stay in place so keep lowering the attribute resistance value of the 'demon'."
  });
  gAbilities.push({
    id: 837,
    name: "Weight of the Sakura (Devastation + Oni Tangle+ (Accuracy))",
    description: "Increases the damage you inflict with a precision strike, and turns all jumping attacks into precision strikes."
  });
  gAbilities.push({
    id: 838,
    name: "Whirlwind",
    description: "Increases movment and attack speed and decreases Focus Consumption when executing a Dual Knives' Dash"
  });
  gAbilities.push({
    id: 839,
    name: "Willpower",
    description: "Greatly reduces charge times of Spear thrust attacks."
  });
  gAbilities.push({
    id: 840,
    name: "Women's Quarters (Protection + Majesty)",
    description: "defense force is increased, when the strength is maximum, weapon gauge increased amount is increased"
  });
  gAbilities.push({
    id: 841,
    name: "Wrath",
    description: "Increased chance for precision strikes while your Health is low."
  });
  gAbilities.push({
    id: 842,
    name: "Young Genius (Knowledge (Leech) + Exuberance)",
    description: "Physical strength is restored, depending on the damage dealt by the Great attribute attack. In addition, when physical strength is maximum, damage is increased."
  });
  gAbilities.push({
    id: 843,
    name: "Zeal (Increase)",
    description: "Number of uses of Zeal is increased."
  });
  gAbilities.push({
    id: 844,
    name: "Zeal (Reduce)",
    description: "Reduce the cooldown of Zeal."
  });
  gAbilities.push({
    id: 845,
    name: "Zeal (Time)",
    description: "Extends the duration of Zeal"
  });
  gAbilities.push({
    id: 846,
    name: "Zeal+ (Accuracy)",
    description: "Increases Precision Strike chance while Zeal is active."
  });
  gAbilities.push({
    id: 847,
    name: "Zeal+ (Amplify)",
    description: "Improves the Focus Recovery bonus provided by Zeal."
  });
  gAbilities.push({
    id: 848,
    name: "Zeal+ (Ardor)",
    description: "Increases precision and give the Fervor ability to all when Zeal is active"
  });
  gAbilities.push({
    id: 849,
    name: "Zeal+ (Attributes)",
    description: "Elemental Damage is increased while Zeal is active."
  });
  gAbilities.push({
    id: 850,
    name: "Zeal+ (Purify)",
    description: "After purifying an Oni or Body part, if you have a Healing Mitama equipped to your Weapon there is a chance to gain an extra charge of Zeal."
  });
  gAbilities.push({
    id: 851,
    name: "Zeal+ (Rage)",
    description: "Increases Attack Power while Zeal is active."
  });
  gAbilities.push({
    id: 852,
    name: "Zeal+ (Swift)",
    description: "Movement speed is increased to all while Zeal is in effect"
  });
  gAbilities.push({
    id: 853,
    name: "Zeal+ (Valor)",
    description: "Rarely Fully replenish everyones Focus when Zeal is activated."
  });
  gAbilities.push({
    id: 854,
    name: "Zeal+ (Wraith)",
    description: "Weapon Gauge points gained are increased while Zeal is active."
  });
  gAbilities.push({
    id: 855,
    name: "Exigency",
    description: "When health is low, increase movment speed"
  });
  gAbilities.push({
    id: 856,
    name: "Exploit (Assist)",
    description: "Increases the amount of points gained for the Unity Gauge when attacking an Oni suffering from a status ailment"
  });
  gAbilities.push({
    id: 857,
    name: "Dissection (Assist)",
    description: "Fills up Unity Gauge when defeating Oni or breaking Body Parts"
  });
  gAbilities.push({
    id: 858,
    name: "Dissection (Quicken)",
    description: "Shortens Skill Cooldowns when defeating Oni or breaking Body Parts"
  });
  gAbilities.push({
    id: 859,
    name: "Dissection (Wraith)",
    description: "Fills up Weapon Gauge when defeating Oni or breaking Body Parts"
  });
  gAbilities.push({
    id: 860,
    name: "Greed",
    description: "When purifying body parts, in rare cases earn 2 of that material"
  });
  gAbilities.push({
    id: 861,
    name: "Conviction",
    description: "Survive an attack that would normally kill you, providing you have sufficient health"
  });
  gAbilities.push({
    id: 862,
    name: "Lowered Immunity",
    description: "Makes Oni more likely to be infected by ailments after an Oni Burial"
  });
  gAbilities.push({
    id: 863,
    name: "Oni Throw+ (Recover)",
    description: "Tripping Oni will restore Health"
  });
  gAbilities.push({
    id: 864,
    name: "Oni Burial+ (Quicken)",
    description: "When using Oni Burials, all cooldowns are shortened."
  });
  gAbilities.push({
    id: 865,
    name: "Oni Burial+ (Extend)",
    description: "Active skills are extended in duration when you use an Oni Burial"
  });
  gAbilities.push({
    id: 866,
    name: "Barrier+ (Nimble)",
    description: "Increases attack speed while Barrier is active"
  });
  gAbilities.push({
    id: 867,
    name: "Panacea+ (Purify)",
    description: "Purifying body parts may restore a Panacea Stock"
  });
  gAbilities.push({
    id: 868,
    name: "Illusion+ (Swift)",
    description: "Increases movement speed while Illusion is active"
  });
  gAbilities.push({
    id: 869,
    name: "Warp+ (Flight)",
    description: "Increases Distance of Warp"
  });
  gAbilities.push({
    id: 870,
    name: "LCK Master (Revival)",
    description: "Purification has a greater chance at restoring Revival stocks"
  });
  gAbilities.push({
    id: 871,
    name: "Fortune+ (Extend)",
    description: "When Fortune Triggers Very Lucky, Extends Active Random Skill"
  });

  gAbilities.sort(sortByName);
}

function initializeCombinations() {
  gCombinations = [];
  gCombinations.getForAbilities = function(selectedAbilities) {
    var rv = [];
    for (var i = 0; i < gCombinations.length; i++) {
      var comb = gCombinations[i];
      if (excludedMitamas.indexOf(comb.mitamas[0]) >= 0 || excludedMitamas.indexOf(comb.mitamas[1]) >= 0 || excludedMitamas.indexOf(comb.mitamas[2]) >= 0)
        continue;

      var valid = true;
      for (var ind = 0; ind < selectedAbilities.length; ind++) {
        var validatingAbility = selectedAbilities[ind];
        var abilityInBoost = false;
        for (var k = 0; k < comb.boosts.length; k++) {
          if (comb.boosts[k].boost.indexOf(validatingAbility.id) >= 0) {
            abilityInBoost = true;
            break;
          }
        }
        // 8, 17 and 26 are the unique abilities which require namechecks
        var uniqueA = gAbilities.get(comb.abilities[8]);
        var uniqueB = gAbilities.get(comb.abilities[17]);
        var uniqueC = gAbilities.get(comb.abilities[26]);
        if (!abilityInBoost && comb.abilities.indexOf(validatingAbility.id) < 0 && uniqueA.name.indexOf(validatingAbility.name) < 0 && uniqueB.name.indexOf(validatingAbility.name) < 0 && uniqueC.name.indexOf(validatingAbility.name) < 0) {
          valid = false;
          break;
        }
      }
      if (valid)
        rv.push(gCombinations[i]);
    }

    return rv;
  }

  // Init entries
  for (var i = 0; i < gMitamas.length; i++) {
    for (var j = i + 1; j < gMitamas.length; j++) {
      for (var k = j + 1; k < gMitamas.length; k++) {
        var mA = gMitamas[i];
        var mB = gMitamas[j];
        var mC = gMitamas[k];
        gCombinations.push({
          mitamas: [mA.id, mB.id, mC.id],
          abilities: [].concat(mA.abilities, mB.abilities, mC.abilities),
          boosts: gBoosts.getForMitamas(mA, mB, mC)
        });
      }
    }
  }
}

function initializeMitamas() {
  gMitamas = [];
  gMitamas.getByName = function(name) {
    for (var i = 0; i < gMitamas.length; i++) {
      if (gMitamas[i].name === name)
        return gMitamas[i];
    };

    return undefined;
  };
  gMitamas.getScore = function(mitama, abilities) {
    var score = 0;
    mitama.abilities.forEach(function(ability) {
      for (var i = 0; i < abilities.length; i++)
        if (abilities[i].id === ability)
          score++;
    });
    return score;
  };
  gMitamas.get = function(id) {
    for (var i = 0; i < gMitamas.length; i++) {
      if (gMitamas[i].id === id)
        return gMitamas[i];
    }

    return undefined;
  };

  // Init entries
  gMitamas.push({
    id: 0,
    name: "Abe no Seimei",
    category: "CON",
    location: "Wingspawn (Normal)",
    abilities: [411, 779, 100, 104, 173, 178, 209, 211, 0],
    age: "Grace"
  });
  gMitamas.push({
    id: 1,
    name: "Admiral Perry",
    category: "SPT",
    location: "Drakwing (Expert)",
    abilities: [711, 585, 388, 593, 586, 246, 347, 352, 511],
    age: "Chaos"
  });
  gMitamas.push({
    id: 2,
    name: "Akechi Mitsuhide",
    category: "LCK",
    location: "Petros (Expert)",
    abilities: [259, 266, 264, 614, 612, 607, 148, 150, 789],
    age: "War"
  });
  gMitamas.push({
    id: 3,
    name: "Amakusa Shirō",
    category: "HLG",
    location: "Venom Queen (Expert)",
    abilities: [354, 553, 513, 493, 846, 851, 850, 514, 387],
    age: "Peace"
  });
  gMitamas.push({
    id: 4,
    name: "Amaterasu",
    category: "SPD",
    location: "Story (Benizuki)",
    abilities: [268, 472, 93, 90, 804, 803, 29, 474, 825],
    age: "Yore"
  });
  gMitamas.push({
    id: 5,
    name: "Arai Hakuseki",
    category: "SPD",
    location: "Windshredder (Expert)",
    abilities: [213, 800, 797, 798, 474, 473, 556, 564, 784],
    age: "Peace"
  });
  gMitamas.push({
    id: 6,
    name: "Ariwara no Narihira",
    category: "SPC",
    location: "Hermitclaw (Expert)",
    abilities: [779, 708, 714, 321, 319, 578, 583, 582, 401],
    age: "Grace"
  });
  gMitamas.push({
    id: 7,
    name: "Arthur",
    category: "DEF",
    location: "Drakwing (Normal)",
    abilities: [719, 689, 94, 88, 742, 738, 510, 508, 409],
    age: "Yore"
  });
  gMitamas.push({
    id: 8,
    name: "Asakura Sōteki",
    category: "ATK",
    location: "Quadbracchium (Normal)",
    abilities: [80, 423, 422, 420, 380, 377, 206, 208, 624],
    age: "War"
  });
  gMitamas.push({
    id: 9,
    name: "Ashikaga Takauji",
    category: "CON",
    location: "Succuwing (Story)",
    abilities: [532, 138, 762, 488, 278, 281, 723, 728, 3],
    age: "Honor"
  });
  gMitamas.push({
    id: 10,
    name: "Ashikaga Yoshimasa",
    category: "DCT",
    location: "Scorpioclaw  (Expert)",
    abilities: [213, 735, 261, 171, 371, 733, 294, 296, 249],
    age: "Honor"
  });
  gMitamas.push({
    id: 11,
    name: "Ashikaga Yoshimitsu",
    category: "HLG",
    location: "Canidaemon (Expert)",
    abilities: [716, 514, 614, 615, 518, 513, 291, 294, 408],
    age: "Honor"
  });
  gMitamas.push({
    id: 12,
    name: "Ashikaga Yoshiteru",
    category: "ATK",
    location: "Petros (Normal)",
    abilities: [135, 445, 272, 276, 697, 830, 446, 447, 406],
    age: "War"
  });
  gMitamas.push({
    id: 13,
    name: "Ashiya Doman",
    category: "CON",
    location: "Wingspawn (Expert)",
    abilities: [778, 285, 779, 731, 100, 173, 174, 151, 415],
    age: "Grace"
  });
  gMitamas.push({
    id: 14,
    name: "Aterui",
    category: "DEF",
    location: "Cruspisces (Expert)",
    abilities: [691, 690, 777, 452, 465, 428, 504, 506, 273],
    age: "Grace"
  });
  gMitamas.push({
    id: 15,
    name: "Benkei",
    category: "DEF",
    location: "Edax (Expert)",
    abilities: [762, 190, 24, 755, 683, 680, 376, 508, 442],
    age: "Honor"
  });
  gMitamas.push({
    id: 16,
    name: "Beowulf",
    category: "PLN",
    location: "Story (Gwen)",
    abilities: [274, 221, 755, 756, 19, 22, 738, 737, 330],
    age: "Grace"
  });
  gMitamas.push({
    id: 17,
    name: "Bishamonten",
    category: "ATK",
    location: "Chthonian Fiend (Expert)",
    abilities: [388, 113, 134, 133, 854, 846, 848, 443, 335],
    age: "Yore"
  });
  gMitamas.push({
    id: 18,
    name: "Brünnhilde",
    category: "SPC",
    location: "DLC (Manga: Gwen)",
    abilities: [259, 326, 289, 701, 698, 671, 663, 670, 649],
    age: "Yore"
  });
  gMitamas.push({
    id: 19,
    name: "Chacha",
    category: "SPT",
    location: "Jollux (Expert)",
    abilities: [450, 491, 321, 319, 161, 164, 253, 255, 783],
    age: "War"
  });
  gMitamas.push({
    id: 20,
    name: "Chiba Sanako",
    category: "SPD",
    location: "Mortabella (Expert)",
    abilities: [259, 234, 838, 803, 739, 740, 470, 474, 687],
    age: "Chaos"
  });
  gMitamas.push({
    id: 21,
    name: "Chiba Shūsaku",
    category: "SPC",
    location: "Anomalos (Normal)",
    abilities: [135, 820, 699, 667, 665, 30, 29, 817, 467],
    age: "Chaos"
  });
  gMitamas.push({
    id: 22,
    name: "Chiku Rin In",
    category: "SUP",
    location: "DLC (Pre-order)",
    abilities: [650, 655, 450, 423, 424, 658, 534, 538, 398],
    age: "War"
  });
  gMitamas.push({
    id: 23,
    name: "Chiyome Mochizuki",
    category: "DCT",
    location: "DLC (Manga: Kaguya)",
    abilities: [192, 498, 212, 838, 169, 171, 567, 572, 414],
    age: "War"
  });
  gMitamas.push({
    id: 24,
    name: "Chosokabe Motochika",
    category: "SPD",
    location: "Skyshredder (Normal)",
    abilities: [550, 803, 194, 702, 234, 231, 43, 42, 503],
    age: "War"
  });
  gMitamas.push({
    id: 25,
    name: "Date Masamune",
    category: "PLN",
    location: "Stealthwing (Expert)",
    abilities: [119, 19, 640, 800, 804, 120, 349, 348, 788],
    age: "War"
  });
  gMitamas.push({
    id: 26,
    name: "En no Ozunu",
    category: "SPD",
    location: "Umbrapod (Normal)",
    abilities: [748, 779, 44, 40, 800, 796, 174, 177, 106],
    age: "Yore"
  });
  gMitamas.push({
    id: 27,
    name: "Fujiwara no Fuhito",
    category: "CON",
    location: "Tenrin Kaija (Expert)",
    abilities: [411, 779, 492, 99, 102, 558, 208, 209, 95],
    age: "Yore"
  });
  gMitamas.push({
    id: 28,
    name: "Fujiwara no Hidesato",
    category: "DEF",
    location: "Ogre (Story)",
    abilities: [554, 450, 501, 179, 679, 681, 83, 84, 496],
    age: "Grace"
  });
  gMitamas.push({
    id: 29,
    name: "Fujiwara no Kamatari",
    category: "LCK",
    location: "Tenrin Kaija (Expert)",
    abilities: [313, 302, 247, 734, 528, 565, 559, 563, 597],
    age: "Yore"
  });
  gMitamas.push({
    id: 30,
    name: "Fujiwara no Michinaga",
    category: "CON",
    location: "Aurogrinder (Normal)",
    abilities: [80, 139, 459, 460, 174, 178, 211, 210, 327],
    age: "Grace"
  });
  gMitamas.push({
    id: 31,
    name: "Fujiwara no Sadaie",
    category: "SUP",
    location: "Viper Queen (Expert)",
    abilities: [531, 534, 655, 658, 537, 538, 819, 817, 229],
    age: "Honor"
  });
  gMitamas.push({
    id: 32,
    name: "Fukuzawa Yukichi",
    category: "LCK",
    location: "Leohomin (Story)",
    abilities: [343, 305, 308, 302, 647, 648, 582, 584, 677],
    age: "Chaos"
  });
  gMitamas.push({
    id: 33,
    name: "Gion no Nyougo",
    category: "HLG",
    location: "Maledictuar (Normal)",
    abilities: [642, 82, 630, 809, 807, 724, 728, 86, 764],
    age: "Grace"
  });
  gMitamas.push({
    id: 34,
    name: "Go",
    category: "DEF",
    location: "Swiftwing (Expert)",
    abilities: [267, 756, 634, 754, 752, 517, 695, 692, 512],
    age: "Peace"
  });
  gMitamas.push({
    id: 35,
    name: "Goto Matabei",
    category: "SUP",
    location: "Story (Tsubaki)",
    abilities: [274, 289, 537, 500, 48, 56, 55, 535, 625],
    age: "War"
  });
  gMitamas.push({
    id: 36,
    name: "Hachikadzuki",
    category: "SUP",
    location: "Wingspawn (Normal)",
    abilities: [267, 720, 682, 683, 744, 197, 204, 510, 34],
    age: "Grace"
  });
  gMitamas.push({
    id: 37,
    name: "Hasegawa Heizo",
    category: "ATK",
    location: "Windshredder (Normal)",
    abilities: [80, 489, 463, 426, 429, 609, 380, 376, 157],
    age: "Peace"
  });
  gMitamas.push({
    id: 38,
    name: "Hatsu",
    category: "CON",
    location: "Ogre (Normal)",
    abilities: [267, 622, 141, 725, 728, 86, 208, 211, 25],
    age: "Peace"
  });
  gMitamas.push({
    id: 39,
    name: "Hattori Hanzo",
    category: "DCT",
    location: "Story (Homura)",
    abilities: [479, 497, 153, 263, 735, 30, 31, 150, 73],
    age: "War"
  });
  gMitamas.push({
    id: 40,
    name: "Hieda no Are",
    category: "CON",
    location: "DLC (Famitsu 9/29/16)",
    abilities: [541, 411, 622, 611, 283, 98, 103, 100, 628],
    age: "Grace"
  });
  gMitamas.push({
    id: 41,
    name: "Hijikata Toshizo",
    category: "DEF",
    location: "Brutebeast (Normal)",
    abilities: [213, 761, 181, 755, 94, 93, 693, 506, 840],
    age: "Chaos"
  });
  gMitamas.push({
    id: 42,
    name: "Hikaru Genji",
    category: "HLG",
    location: "Onyxwing (Expert)",
    abilities: [261, 357, 630, 846, 851, 844, 150, 149, 451],
    age: "Grace"
  });
  gMitamas.push({
    id: 43,
    name: "Himiko",
    category: "CON",
    location: "Chthonian Fiend (Normal)",
    abilities: [226, 726, 96, 499, 140, 728, 102, 819, 836],
    age: "Yore"
  });
  gMitamas.push({
    id: 44,
    name: "Hino Tomiko",
    category: "LCK",
    location: "Glaciabella (Normal)",
    abilities: [416, 308, 310, 303, 578, 583, 293, 292, 477],
    age: "Honor"
  });
  gMitamas.push({
    id: 45,
    name: "Hiraga Gennai",
    category: "CON",
    location: "Story (Professor)",
    abilities: [646, 441, 281, 287, 728, 727, 602, 600, 224],
    age: "Peace"
  });
  gMitamas.push({
    id: 46,
    name: "Hisashige Tanaka",
    category: "CON",
    location: "DLC (Manga: Prof/Tokitsugu)",
    abilities: [541, 493, 790, 141, 278, 286, 254, 258, 400],
    age: "Chaos"
  });
  gMitamas.push({
    id: 47,
    name: "Hojo Masako",
    category: "DCT",
    location: "Bloodhunter (Normal)",
    abilities: [214, 354, 841, 658, 653, 65, 66, 67, 59],
    age: "Honor"
  });
  gMitamas.push({
    id: 48,
    name: "Hojo Tokimune",
    category: "DEF",
    location: "Glaciabella (Expert)",
    abilities: [630, 184, 758, 754, 65, 67, 509, 506, 185],
    age: "Honor"
  });
  gMitamas.push({
    id: 49,
    name: "Honda Tadakatsu",
    category: "DEF",
    location: "Free Roam (Sidequest)",
    abilities: [749, 113, 680, 758, 678, 94, 350, 352, 787],
    age: "War"
  });
  gMitamas.push({
    id: 50,
    name: "Hosokawa Gracia",
    category: "DCT",
    location: "Pyropteryx (Normal)",
    abilities: [635, 68, 113, 847, 846, 567, 568, 66, 355],
    age: "War"
  });
  gMitamas.push({
    id: 51,
    name: "Hōjō Sōun",
    category: "DCT",
    location: "Carcinus (Expert)",
    abilities: [354, 263, 645, 373, 732, 733, 504, 506, 168],
    age: "War"
  });
  gMitamas.push({
    id: 52,
    name: "Ibaraki dōji",
    category: "LCK",
    location: "Cruspisces (Expert)",
    abilities: [627, 557, 480, 132, 94, 797, 560, 564, 780],
    age: "Grace"
  });
  gMitamas.push({
    id: 53,
    name: "Ii Naosuke",
    category: "DCT",
    location: "Leohomin (Normal)",
    abilities: [841, 169, 572, 265, 132, 571, 65, 67, 637],
    age: "Chaos"
  });
  gMitamas.push({
    id: 54,
    name: "Ikkyū",
    category: "SPC",
    location: "Bloodhunter (Expert)",
    abilities: [501, 523, 645, 181, 755, 757, 832, 528, 275],
    age: "Honor"
  });
  gMitamas.push({
    id: 55,
    name: "Imagawa Yoshimoto",
    category: "HLG",
    location: "Jollux (Normal)",
    abilities: [631, 358, 847, 849, 103, 102, 81, 86, 227],
    age: "War"
  });
  gMitamas.push({
    id: 56,
    name: "Inō Tadataka",
    category: "SPC",
    location: "Goylespawn (Expert)",
    abilities: [748, 827, 749, 829, 522, 526, 578, 583, 483],
    age: "Peace"
  });
  gMitamas.push({
    id: 57,
    name: "Ishida Mitsunari",
    category: "LCK",
    location: "Pyropteryx (Expert)",
    abilities: [137, 309, 797, 618, 307, 303, 556, 564, 771],
    age: "War"
  });
  gMitamas.push({
    id: 58,
    name: "Ishikawa Goemon",
    category: "LCK",
    location: "Carcinus (Normal)",
    abilities: [717, 314, 236, 41, 799, 618, 316, 306, 339],
    age: "War"
  });
  gMitamas.push({
    id: 59,
    name: "Issun-boshi",
    category: "PLN",
    location: "Canidaemon (Normal)",
    abilities: [354, 23, 113, 839, 544, 16, 18, 29, 436],
    age: "Honor"
  });
  gMitamas.push({
    id: 60,
    name: "Iyo",
    category: "SPD",
    location: "Free Roam (Surrounds Sidequest)",
    abilities: [635, 410, 491, 804, 796, 27, 28, 363, 743],
    age: "Yore"
  });
  gMitamas.push({
    id: 61,
    name: "Izanagi",
    category: "ATK",
    location: "Tokiwa-no-Orochi (Expert)",
    abilities: [272, 79, 353, 463, 462, 128, 580, 581, 215],
    age: "Yore"
  });
  gMitamas.push({
    id: 62,
    name: "Izanami",
    category: "SPT",
    location: "Tokiwa-no-Orochi (Expert)",
    abilities: [841, 354, 24, 710, 322, 323, 150, 152, 215],
    age: "Yore"
  });
  gMitamas.push({
    id: 63,
    name: "Izumo no Okuni",
    category: "SPC",
    location: "Quadbracchium (Story)",
    abilities: [448, 522, 137, 699, 667, 819, 556, 563, 403],
    age: "War"
  });
  gMitamas.push({
    id: 64,
    name: "Jeanne d'Arc",
    category: "SUP",
    location: "Colubra (Expert)",
    abilities: [745, 51, 259, 790, 49, 58, 656, 653, 660],
    age: "Honor"
  });
  gMitamas.push({
    id: 65,
    name: "Jianzhen",
    category: "LCK",
    location: "Cruspisces (Normal)",
    abilities: [645, 636, 631, 518, 517, 418, 615, 561, 769],
    age: "Grace"
  });
  gMitamas.push({
    id: 66,
    name: "Jigoku Dayu",
    category: "DCT",
    location: "Bladetail (Normal)",
    abilities: [226, 148, 194, 321, 322, 573, 151, 153, 475],
    age: "Honor"
  });
  gMitamas.push({
    id: 67,
    name: "John Manjirō",
    category: "LCK",
    location: "Drakwing (Expert)",
    abilities: [645, 671, 830, 527, 610, 617, 583, 818, 2],
    age: "Chaos"
  });
  gMitamas.push({
    id: 68,
    name: "Kakinomoto no Hitomaro",
    category: "SPT",
    location: "Shadow Soul (Expert)",
    abilities: [779, 492, 712, 713, 248, 578, 582, 584, 250],
    age: "Yore"
  });
  gMitamas.push({
    id: 69,
    name: "Kamiizumi Nobutsuna",
    category: "ATK",
    location: "Quadbracchium (Expert)",
    abilities: [223, 422, 430, 423, 424, 816, 819, 820, 530],
    age: "War"
  });
  gMitamas.push({
    id: 70,
    name: "Kamo no Chōmei",
    category: "DCT",
    location: "Bladetail (Expert)",
    abilities: [792, 372, 369, 370, 66, 68, 600, 601, 241],
    age: "Honor"
  });
  gMitamas.push({
    id: 71,
    name: "Kamo no Tadayuki",
    category: "CON",
    location: "Astrapteryx (Normal)",
    abilities: [226, 281, 155, 284, 97, 101, 102, 165, 331],
    age: "Grace"
  });
  gMitamas.push({
    id: 72,
    name: "Katsu Kaishu",
    category: "SPD",
    location: "Umbrapod (Expert)",
    abilities: [450, 499, 232, 239, 237, 40, 579, 582, 765],
    age: "Chaos"
  });
  gMitamas.push({
    id: 73,
    name: "Katsura Kogorō",
    category: "SUP",
    location: "Leohomin (Expert)",
    abilities: [792, 536, 122, 169, 371, 658, 654, 540, 405],
    age: "Chaos"
  });
  gMitamas.push({
    id: 74,
    name: "Katsushika Hokusai",
    category: "SPT",
    location: "Bruteclaw (Normal)",
    abilities: [411, 715, 592, 593, 693, 694, 158, 162, 329],
    age: "Peace"
  });
  gMitamas.push({
    id: 75,
    name: "Ki no Tsurayuki",
    category: "SPC",
    location: "Astrapteryx (Normal)",
    abilities: [37, 262, 571, 576, 574, 816, 817, 822, 432],
    age: "Grace"
  });
  gMitamas.push({
    id: 76,
    name: "Kondō Isami",
    category: "PLN",
    location: "Brutebeast (Normal)",
    abilities: [792, 192, 543, 114, 121, 740, 150, 153, 773],
    age: "Chaos"
  });
  gMitamas.push({
    id: 77,
    name: "Konohana sakuya-hime",
    category: "HLG",
    location: "Phlogistor (Normal)",
    abilities: [266, 810, 137, 808, 809, 518, 86, 82, 332],
    age: "Yore"
  });
  gMitamas.push({
    id: 78,
    name: "Kozō Nezumi",
    category: "SPD",
    location: "DLC (Manga: Benizuki/Homura)",
    abilities: [76, 252, 232, 238, 795, 804, 291, 297, 486],
    age: "Peace"
  });
  gMitamas.push({
    id: 79,
    name: "Kukai",
    category: "SPC",
    location: "Hermitclaw (Normal)",
    abilities: [645, 698, 668, 670, 198, 201, 584, 580, 413],
    age: "Grace"
  });
  gMitamas.push({
    id: 80,
    name: "Kuroda Kanbee",
    category: "CON",
    location: "Quadbracchium (Expert)",
    abilities: [779, 140, 281, 283, 722, 726, 363, 364, 123],
    age: "War"
  });
  gMitamas.push({
    id: 81,
    name: "Kusaka Genzui",
    category: "DEF",
    location: "Anomalos (Expert)",
    abilities: [776, 272, 184, 180, 588, 590, 505, 507, 156],
    age: "Chaos"
  });
  gMitamas.push({
    id: 82,
    name: "Kusumoto Ine",
    category: "HLG",
    location: "Drakwing (Normal)",
    abilities: [846, 848, 33, 745, 58, 82, 254, 255, 412],
    age: "Chaos"
  });
  gMitamas.push({
    id: 83,
    name: "Kusunoki Masashige",
    category: "SPD",
    location: "Glaciabella (Expert)",
    abilities: [762, 702, 43, 38, 30, 504, 508, 506, 5],
    age: "Honor"
  });
  gMitamas.push({
    id: 84,
    name: "Kuzunoha",
    category: "SUP",
    location: "Onyxwing (Normal)",
    abilities: [638, 744, 657, 202, 199, 653, 206, 208, 11],
    age: "Grace"
  });
  gMitamas.push({
    id: 85,
    name: "Lady Atsu",
    category: "ATK",
    location: "Cacarion (Expert)",
    abilities: [137, 426, 632, 427, 195, 202, 203, 375, 775],
    age: "Chaos"
  });
  gMitamas.push({
    id: 86,
    name: "Lady Fuse",
    category: "SUP",
    location: "Bruteclaw (Normal)",
    abilities: [675, 603, 532, 499, 528, 521, 522, 598, 449],
    age: "Peace"
  });
  gMitamas.push({
    id: 87,
    name: "Lady Hangaku",
    category: "PLN",
    location: "Viper Queen (Expert)",
    abilities: [632, 347, 747, 543, 545, 83, 82, 84, 781],
    age: "Honor"
  });
  gMitamas.push({
    id: 88,
    name: "Lady Ina",
    category: "SPC",
    location: "Abyssal Fiend (Expert)",
    abilities: [326, 832, 144, 758, 753, 701, 816, 820, 644],
    age: "War"
  });
  gMitamas.push({
    id: 89,
    name: "Lady Kaguya",
    category: "DCT",
    location: "Onyxwing (Expert)",
    abilities: [137, 68, 501, 630, 633, 67, 352, 348, 478],
    age: "Grace"
  });
  gMitamas.push({
    id: 90,
    name: "Lady Kai",
    category: "DEF",
    location: "Petros (Normal)",
    abilities: [646, 756, 353, 759, 800, 803, 505, 509, 189],
    age: "War"
  });
  gMitamas.push({
    id: 91,
    name: "Lady Kasuga",
    category: "CON",
    location: "Venom Queen (Normal)",
    abilities: [259, 725, 138, 729, 693, 695, 208, 210, 495],
    age: "Peace"
  });
  gMitamas.push({
    id: 92,
    name: "Lady Kukuri",
    category: "SUP",
    location: "DLC (PS Store Contest Winner)",
    abilities: [675, 48, 56, 55, 158, 160, 599, 603, 225],
    age: "Yore"
  });
  gMitamas.push({
    id: 93,
    name: "Lady Kushinada",
    category: "HLG",
    location: "Tokiwa-no-Orochi (Normal)",
    abilities: [76, 461, 458, 847, 846, 845, 81, 82, 746],
    age: "Yore"
  });
  gMitamas.push({
    id: 94,
    name: "Lady Mego",
    category: "SPT",
    location: "DLC (Dengeki 7/28/16)",
    abilities: [137, 591, 592, 158, 165, 160, 351, 350, 549],
    age: "War"
  });
  gMitamas.push({
    id: 95,
    name: "Lady Miyazu",
    category: "ATK",
    location: "Crocodilus(Normal)",
    abilities: [411, 422, 426, 425, 161, 160, 444, 446, 344],
    age: "Yore"
  });
  gMitamas.push({
    id: 96,
    name: "Lady Nō",
    category: "SUP",
    location: "Jollux (Normal)",
    abilities: [63, 639, 745, 53, 393, 396, 601, 606, 126],
    age: "War"
  });
  gMitamas.push({
    id: 97,
    name: "Lady Ototachibana",
    category: "SUP",
    location: "Venter (Normal)",
    abilities: [137, 199, 779, 800, 804, 745, 536, 537, 341],
    age: "Yore"
  });
  gMitamas.push({
    id: 98,
    name: "Lady Sen",
    category: "HLG",
    location: "Manhunter (Expert)",
    abilities: [194, 450, 854, 809, 516, 514, 255, 257, 112],
    age: "Peace"
  });
  gMitamas.push({
    id: 99,
    name: "Lady Shizuka",
    category: "HLG",
    location: "Bladetail (Story)",
    abilities: [493, 805, 125, 422, 419, 807, 253, 255, 60],
    age: "Honor"
  });
  gMitamas.push({
    id: 100,
    name: "Lady Sotoori",
    category: "SUP",
    location: "Phlogistor (Normal)",
    abilities: [194, 51, 58, 656, 536, 539, 256, 255, 786],
    age: "Yore"
  });
  gMitamas.push({
    id: 101,
    name: "Lady Suzuka",
    category: "SPT",
    location: "Free Roam (Sidequest)",
    abilities: [410, 708, 247, 713, 161, 164, 819, 817, 772],
    age: "Grace"
  });
  gMitamas.push({
    id: 102,
    name: "Lady Takiyasha",
    category: "HLG",
    location: "Wingspawn (Normal)",
    abilities: [144, 255, 492, 849, 155, 103, 100, 256, 791],
    age: "Grace"
  });
  gMitamas.push({
    id: 103,
    name: "Lady Tokiwa",
    category: "SPD",
    location: "Glaciabella (Normal)",
    abilities: [136, 675, 238, 797, 196, 200, 470, 472, 107],
    age: "Honor"
  });
  gMitamas.push({
    id: 104,
    name: "Lady Yamato",
    category: "PLN",
    location: "Phlogistor (Expert)",
    abilities: [545, 14, 212, 20, 163, 165, 350, 351, 62],
    age: "Yore"
  });
  gMitamas.push({
    id: 105,
    name: "Lady Tomoe",
    category: "ATK",
    location: "Free Roam (Sidequest)",
    abilities: [190, 194, 132, 129, 40, 38, 376, 380, 172],
    age: "Honor"
  });
  gMitamas.push({
    id: 106,
    name: "Maeda Keiji",
    category: "LCK",
    location: "Quadbracchium (Normal)",
    abilities: [131, 609, 143, 614, 378, 379, 446, 557, 146],
    age: "War"
  });
  gMitamas.push({
    id: 107,
    name: "Masayuki Hoshina",
    category: "SUP",
    location: "Swiftwing (Normal)",
    abilities: [716, 198, 642, 745, 47, 50, 202, 199, 108],
    age: "Peace"
  });
  gMitamas.push({
    id: 108,
    name: "Matsu",
    category: "HLG",
    location: "DLC (Famitsu 8/11/16)",
    abilities: [675, 844, 853, 850, 377, 376, 254, 257, 718],
    age: "War"
  });
  gMitamas.push({
    id: 109,
    name: "Matsudaira Katamori",
    category: "DEF",
    location: "Aquaclaw (Normal)",
    abilities: [213, 92, 758, 755, 680, 613, 690, 693, 706],
    age: "Chaos"
  });
  gMitamas.push({
    id: 110,
    name: "Matsuo Bashō",
    category: "DCT",
    location: "Manhunter (Expert)",
    abilities: [37, 372, 263, 170, 371, 374, 732, 68, 823],
    age: "Peace"
  });
  gMitamas.push({
    id: 111,
    name: "Minamoto no Tametomo",
    category: "ATK",
    location: "Free Roam (Sidequest)",
    abilities: [70, 272, 460, 463, 456, 129, 133, 134, 6],
    age: "Honor"
  });
  gMitamas.push({
    id: 112,
    name: "Minamoto no Yorimasa",
    category: "SPC",
    location: "Bladetail (Normal)",
    abilities: [272, 665, 154, 664, 662, 524, 161, 162, 766],
    age: "Honor"
  });
  gMitamas.push({
    id: 113,
    name: "Minamoto no Yorimitsu",
    category: "ATK",
    location: "Onyxwing (Normal)",
    abilities: [80, 463, 78, 464, 462, 134, 375, 377, 186],
    age: "Grace"
  });
  gMitamas.push({
    id: 114,
    name: "Minamoto no Yoritomo",
    category: "DEF",
    location: "Succuwing (Expert)",
    abilities: [499, 183, 760, 750, 91, 87, 582, 581, 542],
    age: "Honor"
  });
  gMitamas.push({
    id: 115,
    name: "Minamoto no Yoshiie",
    category: "SPD",
    location: "Maledictuar (Expert)",
    abilities: [192, 233, 238, 236, 38, 39, 380, 375, 547],
    age: "Grace"
  });
  gMitamas.push({
    id: 116,
    name: "Minamoto no Yoshitsune",
    category: "ATK",
    location: "Story (Starting)",
    abilities: [80, 272, 463, 457, 423, 375, 446, 445, 434],
    age: "Honor"
  });
  gMitamas.push({
    id: 117,
    name: "Mito Mitsukuni",
    category: "SPC",
    location: "Windshredder (Normal)",
    abilities: [700, 831, 410, 830, 524, 173, 175, 210, 793],
    age: "Peace"
  });
  gMitamas.push({
    id: 118,
    name: "Miyamoto Musashi",
    category: "ATK",
    location: "Jollux (Expert)",
    abilities: [192, 133, 337, 130, 377, 469, 472, 473, 382],
    age: "War"
  });
  gMitamas.push({
    id: 119,
    name: "Momotaro",
    category: "SPD",
    location: "Edax (Normal)",
    abilities: [113, 30, 267, 43, 142, 280, 287, 31, 502],
    age: "Honor"
  });
  gMitamas.push({
    id: 120,
    name: "Murasaki Shikibu",
    category: "SPT",
    location: "Cruspisces (Normal)",
    abilities: [629, 164, 632, 714, 589, 588, 159, 162, 271],
    age: "Grace"
  });
  gMitamas.push({
    id: 121,
    name: "Mōri Motonari",
    category: "DCT",
    location: "Stealthwing (Expert)",
    abilities: [736, 734, 770, 65, 67, 68, 207, 208, 684],
    age: "War"
  });
  gMitamas.push({
    id: 122,
    name: "Nagakura Shinpachi",
    category: "SPC",
    location: "Story (Kamuna)",
    abilities: [430, 697, 830, 827, 524, 526, 470, 474, 685],
    age: "Chaos"
  });
  gMitamas.push({
    id: 123,
    name: "Nakano Takeko",
    category: "PLN",
    location: "DLC (Famitsu 9/8/16)",
    abilities: [531, 622, 268, 545, 15, 21, 360, 365, 346],
    age: "Chaos"
  });
  gMitamas.push({
    id: 124,
    name: "Naoe Kanetsugu",
    category: "DEF",
    location: "Skyshredder (Expert)",
    abilities: [137, 753, 500, 751, 657, 655, 693, 692, 482],
    age: "War"
  });
  gMitamas.push({
    id: 125,
    name: "Nasu no Yoichi",
    category: "SPT",
    location: "Succuwing (Expert)",
    abilities: [410, 595, 154, 103, 100, 159, 161, 164, 336],
    age: "Honor"
  });
  gMitamas.push({
    id: 126,
    name: "Nene",
    category: "HLG",
    location: "Pyropteryx (Normal)",
    abilities: [267, 338, 847, 843, 81, 85, 84, 472, 407],
    age: "War"
  });
  gMitamas.push({
    id: 127,
    name: "Niijima Yae",
    category: "SPT",
    location: "Brutebeast (Normal)",
    abilities: [267, 363, 212, 641, 591, 245, 242, 360, 345],
    age: "Chaos"
  });
  gMitamas.push({
    id: 128,
    name: "Ninomiya Sontoku",
    category: "HLG",
    location: "Phytodior (Expert)",
    abilities: [223, 852, 553, 849, 590, 593, 81, 85, 768],
    age: "Peace"
  });
  gMitamas.push({
    id: 129,
    name: "Nitta Yoshisada",
    category: "PLN",
    location: "Succuwing (Normal)",
    abilities: [259, 194, 490, 544, 117, 118, 510, 506, 216],
    age: "Honor"
  });
  gMitamas.push({
    id: 130,
    name: "Nomi no Sukune",
    category: "ATK",
    location: "Venter (Expert)",
    abilities: [326, 379, 260, 463, 465, 380, 508, 506, 439],
    age: "Yore"
  });
  gMitamas.push({
    id: 131,
    name: "Nyabraham Linnyahn",
    category: "DCT",
    location: "DLC (Treasure Box set)",
    abilities: [497, 630, 113, 575, 570, 85, 150, 149, 288],
    age: "Chaos"
  });
  gMitamas.push({
    id: 132,
    name: "Oda Nobunaga",
    category: "PLN",
    location: "Abyssal Fiend (Expert)",
    abilities: [490, 399, 192, 272, 543, 390, 348, 351, 485],
    age: "War"
  });
  gMitamas.push({
    id: 133,
    name: "Oichi",
    category: "ATK",
    location: "Skyshredder (Expert)",
    abilities: [267, 639, 429, 422, 421, 255, 258, 257, 676],
    age: "War"
  });
  gMitamas.push({
    id: 134,
    name: "Oiwa",
    category: "DCT",
    location: "Phytodior (Normal)",
    abilities: [213, 573, 354, 261, 576, 371, 360, 363, 109],
    age: "Peace"
  });
  gMitamas.push({
    id: 135,
    name: "Okada Izō",
    category: "SPC",
    location: "Free Roam (Sidequest)",
    abilities: [697, 830, 337, 833, 665, 663, 347, 352, 75],
    age: "Chaos"
  });
  gMitamas.push({
    id: 136,
    name: "Okikurumi",
    category: "SPC",
    location: "Chthonian Fiend (Expert)",
    abilities: [410, 524, 192, 463, 459, 519, 816, 817, 404],
    age: "Yore"
  });
  gMitamas.push({
    id: 137,
    name: "Okita Sōji",
    category: "SPD",
    location: "Leohomin (Expert)",
    abilities: [192, 233, 342, 702, 240, 26, 30, 472, 546],
    age: "Chaos"
  });
  gMitamas.push({
    id: 138,
    name: "Ono no Imoko",
    category: "LCK",
    location: "Phlogistor (Expert)",
    abilities: [226, 611, 608, 155, 281, 280, 103, 99, 455],
    age: "Yore"
  });
  gMitamas.push({
    id: 139,
    name: "Ono no Komachi",
    category: "SPD",
    location: "Astrapteryx (Expert)",
    abilities: [40, 39, 553, 41, 847, 848, 28, 31, 219],
    age: "Grace"
  });
  gMitamas.push({
    id: 140,
    name: "Ooka Echizen",
    category: "DEF",
    location: "Manhunter (Normal)",
    abilities: [554, 682, 194, 758, 92, 89, 87, 508, 384],
    age: "Peace"
  });
  gMitamas.push({
    id: 141,
    name: "Oryo",
    category: "LCK",
    location: "Mortabella (Normal)",
    abilities: [792, 315, 307, 311, 119, 117, 292, 297, 397],
    age: "Chaos"
  });
  gMitamas.push({
    id: 142,
    name: "Oshio Heihachiro",
    category: "PLN",
    location: "Phytodior (Expert)",
    abilities: [716, 347, 354, 468, 650, 659, 658, 351, 381],
    age: "Peace"
  });
  gMitamas.push({
    id: 143,
    name: "Otose",
    category: "SUP",
    location: "Aurogrinder (Expert)",
    abilities: [630, 204, 51, 50, 659, 656, 556, 566, 359],
    age: "Chaos"
  });
  gMitamas.push({
    id: 144,
    name: "Prince Naka-no-Oe",
    category: "SPT",
    location: "Chthonian Fiend (Normal)",
    abilities: [37, 594, 192, 588, 324, 322, 734, 735, 13],
    age: "Yore"
  });
  gMitamas.push({
    id: 145,
    name: "Prince Shotoku",
    category: "CON",
    location: "Crocodilus(Normal)",
    abilities: [279, 282, 778, 285, 723, 731, 725, 730, 555],
    age: "Yore"
  });
  gMitamas.push({
    id: 146,
    name: "Princess Nukata",
    category: "DCT",
    location: "Chthonian Fiend (Normal)",
    abilities: [65, 66, 354, 634, 725, 727, 68, 148, 440],
    age: "Yore"
  });
  gMitamas.push({
    id: 147,
    name: "Ragna the Bloodedge",
    category: "ATK",
    location: "DLC (BlazeBlue Collab)",
    abilities: [80, 326, 113, 489, 428, 132, 443, 445, 110],
    age: "Chaos"
  });
  gMitamas.push({
    id: 148,
    name: "Raiden Tame'emon",
    category: "DEF",
    location: "Free Roam (Sidequest)",
    abilities: [274, 755, 463, 465, 756, 691, 693, 508, 484],
    age: "Peace"
  });
  gMitamas.push({
    id: 149,
    name: "Saichō",
    category: "LCK",
    location: "Astrapteryx (Expert)",
    abilities: [636, 620, 298, 299, 316, 202, 203, 656, 188],
    age: "Grace"
  });
  gMitamas.push({
    id: 150,
    name: "Saigo Takamori",
    category: "CON",
    location: "Brutebeast (Story)",
    abilities: [643, 213, 383, 173, 175, 177, 208, 211, 12],
    age: "Chaos"
  });
  gMitamas.push({
    id: 151,
    name: "Saika Magoichi",
    category: "SPT",
    location: "Story (Tokitsugu)",
    abilities: [623, 590, 709, 587, 163, 162, 469, 474, 548],
    age: "War"
  });
  gMitamas.push({
    id: 152,
    name: "Saito Kichi",
    category: "SPC",
    location: "DLC (Dengeki 8/11/16)",
    abilities: [523, 520, 778, 529, 147, 152, 579, 580, 438],
    age: "Chaos"
  });
  gMitamas.push({
    id: 153,
    name: "Saitō Hajime",
    category: "DCT",
    location: "Brutebeast (Expert)",
    abilities: [749, 169, 571, 371, 366, 367, 150, 153, 577],
    age: "Chaos"
  });
  gMitamas.push({
    id: 154,
    name: "Sakamoto Otome",
    category: "PLN",
    location: "Anomalos (Expert)",
    abilities: [274, 544, 166, 543, 18, 534, 539, 349, 834],
    age: "Chaos"
  });
  gMitamas.push({
    id: 155,
    name: "Sakamoto Ryoma",
    category: "PLN",
    location: "Free Roam (Sidequest)",
    abilities: [212, 121, 118, 17, 23, 21, 173, 174, 782],
    age: "Chaos"
  });
  gMitamas.push({
    id: 156,
    name: "Sakanoue no Tamuramaro",
    category: "ATK",
    location: "Free Roam (Sidequest)",
    abilities: [226, 749, 459, 463, 461, 134, 163, 164, 8],
    age: "Grace"
  });
  gMitamas.push({
    id: 157,
    name: "Sakata no Kintoki",
    category: "DEF",
    location: "Cruspisces (Normal)",
    abilities: [113, 45, 182, 756, 751, 693, 148, 152, 721],
    age: "Grace"
  });
  gMitamas.push({
    id: 158,
    name: "Sakuma Shozan",
    category: "PLN",
    location: "Mortabella (Normal)",
    abilities: [192, 741, 213, 139, 96, 100, 739, 737, 767],
    age: "Chaos"
  });
  gMitamas.push({
    id: 159,
    name: "Sanada Masayuki",
    category: "LCK",
    location: "DLC (Pre-order)",
    abilities: [762, 465, 460, 758, 94, 316, 307, 297, 487],
    age: "War"
  });
  gMitamas.push({
    id: 160,
    name: "Sanada Nobuyuki",
    category: "DEF",
    location: "DLC (Pre-order)",
    abilities: [274, 508, 753, 683, 92, 510, 446, 447, 269],
    age: "War"
  });
  gMitamas.push({
    id: 161,
    name: "Sanada Yukimura",
    category: "ATK",
    location: "Pyropteryx (Expert)",
    abilities: [326, 461, 435, 426, 429, 131, 740, 741, 402],
    age: "War"
  });
  gMitamas.push({
    id: 162,
    name: "Sarutahiko",
    category: "CON",
    location: "Crocodilus(Expert)",
    abilities: [354, 208, 388, 35, 829, 830, 828, 207, 686],
    age: "Yore"
  });
  gMitamas.push({
    id: 163,
    name: "Sarutobi Sasuke",
    category: "SPD",
    location: "DLC (Pre-order)",
    abilities: [36, 492, 240, 236, 173, 176, 474, 473, 9],
    age: "War"
  });
  gMitamas.push({
    id: 164,
    name: "Sei Shōnagon",
    category: "SUP",
    location: "Cruspisces (Story)",
    abilities: [137, 809, 630, 815, 205, 199, 598, 602, 167],
    age: "Grace"
  });
  gMitamas.push({
    id: 165,
    name: "Sen no Rikyu",
    category: "HLG",
    location: "Wreckbeast (Expert)",
    abilities: [541, 811, 223, 814, 807, 584, 581, 256, 707],
    age: "War"
  });
  gMitamas.push({
    id: 166,
    name: "Sesshū",
    category: "DEF",
    location: "Viper Queen (Normal)",
    abilities: [826, 627, 499, 179, 93, 291, 294, 296, 433],
    age: "Honor"
  });
  gMitamas.push({
    id: 167,
    name: "Shakushain",
    category: "CON",
    location: "Swiftwing (Normal)",
    abilities: [410, 98, 491, 100, 176, 177, 816, 820, 328],
    age: "Peace"
  });
  gMitamas.push({
    id: 168,
    name: "Shimizu no Jirochô",
    category: "LCK",
    location: "Aquaclaw (Expert)",
    abilities: [410, 682, 92, 312, 309, 302, 304, 560, 763],
    age: "Chaos"
  });
  gMitamas.push({
    id: 169,
    name: "Shishido Baiken",
    category: "DCT",
    location: "Free Roam (Sidequest)",
    abilities: [272, 213, 113, 497, 571, 570, 470, 473, 454],
    age: "War"
  });
  gMitamas.push({
    id: 170,
    name: "Shuten-dōji",
    category: "PLN",
    location: "Maledictuar (Expert)",
    abilities: [841, 543, 627, 115, 118, 740, 742, 737, 1],
    age: "Grace"
  });
  gMitamas.push({
    id: 171,
    name: "Siebold",
    category: "HLG",
    location: "Free Roam (Sidequest)",
    abilities: [70, 46, 356, 854, 851, 599, 604, 600, 704],
    age: "Peace"
  });
  gMitamas.push({
    id: 172,
    name: "Siegfried",
    category: "SPD",
    location: "Free Roam (Sidequest)",
    abilities: [388, 804, 798, 630, 43, 795, 505, 509, 217],
    age: "Yore"
  });
  gMitamas.push({
    id: 173,
    name: "Soga no Iruka",
    category: "SPD",
    location: "Shadow Soul (Normal)",
    abilities: [263, 235, 233, 799, 802, 30, 148, 151, 72],
    age: "Yore"
  });
  gMitamas.push({
    id: 174,
    name: "Soga no Umako",
    category: "SUP",
    location: "Aurogrinder (Expert)",
    abilities: [37, 732, 272, 734, 57, 54, 604, 601, 785],
    age: "Yore"
  });
  gMitamas.push({
    id: 175,
    name: "Sugawara no Michizane",
    category: "SPT",
    location: "Wingspawn (Story)",
    abilities: [708, 317, 492, 747, 320, 318, 161, 162, 333],
    age: "Grace"
  });
  gMitamas.push({
    id: 176,
    name: "Sugi Fumi",
    category: "LCK",
    location: "Leohomin (Normal)",
    abilities: [226, 301, 113, 304, 300, 295, 363, 362, 842],
    age: "Chaos"
  });
  gMitamas.push({
    id: 177,
    name: "Sugita Genpaku",
    category: "HLG",
    location: "Goylespawn (Normal)",
    abilities: [213, 386, 847, 851, 255, 258, 352, 350, 187],
    age: "Peace"
  });
  gMitamas.push({
    id: 178,
    name: "Susanoo",
    category: "ATK",
    location: "Tokiwa-no-Orochi (Story)",
    abilities: [749, 463, 460, 134, 446, 445, 349, 352, 389],
    age: "Yore"
  });
  gMitamas.push({
    id: 179,
    name: "Taira no Atsumori",
    category: "SUP",
    location: "Viper Queen (Normal)",
    abilities: [214, 198, 411, 201, 652, 361, 363, 362, 64],
    age: "Honor"
  });
  gMitamas.push({
    id: 180,
    name: "Taira no Kiyomori",
    category: "CON",
    location: "Edax (Expert)",
    abilities: [748, 142, 277, 281, 724, 726, 472, 471, 453],
    age: "Honor"
  });
  gMitamas.push({
    id: 181,
    name: "Taira no Masakado",
    category: "SPT",
    location: "Wingspawn (Expert)",
    abilities: [710, 321, 259, 779, 23, 18, 364, 362, 551],
    age: "Grace"
  });
  gMitamas.push({
    id: 182,
    name: "Taira no Tomomori",
    category: "HLG",
    location: "Scorpioclaw (Normal)",
    abilities: [762, 194, 847, 853, 813, 814, 690, 693, 61],
    age: "Honor"
  });
  gMitamas.push({
    id: 183,
    name: "Takasue's Daughter",
    category: "DCT",
    location: "Onyxwing (Normal)",
    abilities: [37, 170, 263, 575, 568, 733, 819, 821, 4],
    age: "Grace"
  });
  gMitamas.push({
    id: 184,
    name: "Takasugi Shinsaku",
    category: "LCK",
    location: "Drakwing (Normal)",
    abilities: [711, 619, 476, 244, 247, 417, 364, 565, 688],
    age: "Chaos"
  });
  gMitamas.push({
    id: 185,
    name: "Takechi Hanpeita",
    category: "ATK",
    location: "Anomalos (Normal)",
    abilities: [705, 466, 37, 77, 463, 65, 69, 446, 193],
    age: "Chaos"
  });
  gMitamas.push({
    id: 186,
    name: "Takeda Shingen",
    category: "SPC",
    location: "Petros (Expert)",
    abilities: [274, 529, 700, 672, 668, 521, 821, 822, 824],
    age: "War"
  });
  gMitamas.push({
    id: 187,
    name: "Tamamo-no-Mae",
    category: "CON",
    location: "Colubra (Expert)",
    abilities: [263, 285, 286, 282, 103, 101, 347, 352, 835],
    age: "Honor"
  });
  gMitamas.push({
    id: 188,
    name: "Tanuma Okitsugu",
    category: "LCK",
    location: "Bruteclaw (Expert)",
    abilities: [192, 261, 734, 307, 621, 150, 152, 559, 7],
    age: "Peace"
  });
  gMitamas.push({
    id: 189,
    name: "Todo Heisuke",
    category: "PLN",
    location: "Cacarion (Expert)",
    abilities: [748, 213, 392, 393, 578, 583, 352, 351, 661],
    age: "Chaos"
  });
  gMitamas.push({
    id: 190,
    name: "Tokugawa Iemitsu",
    category: "CON",
    location: "Goylespawn (Expert)",
    abilities: [792, 178, 169, 368, 370, 176, 207, 209, 111],
    age: "Peace"
  });
  gMitamas.push({
    id: 191,
    name: "Tokugawa Ieyasu",
    category: "DEF",
    location: "Swiftwing (Expert)",
    abilities: [622, 501, 678, 679, 693, 694, 469, 474, 437],
    age: "Peace"
  });
  gMitamas.push({
    id: 192,
    name: "Tokugawa Tsunayoshi",
    category: "HLG",
    location: "Bruteclaw (Expert)",
    abilities: [450, 212, 811, 813, 807, 806, 739, 740, 385],
    age: "Peace"
  });
  gMitamas.push({
    id: 193,
    name: "Tokugawa Yoshimune",
    category: "PLN",
    location: "Windshredder (Expert)",
    abilities: [252, 22, 627, 543, 119, 117, 292, 297, 220],
    age: "Peace"
  });
  gMitamas.push({
    id: 194,
    name: "Tokugawa Yoshinobu",
    category: "DEF",
    location: "Brutebeast (Expert)",
    abilities: [622, 681, 748, 682, 683, 599, 602, 605, 674],
    age: "Chaos"
  });
  gMitamas.push({
    id: 195,
    name: "Toro",
    category: "ATK",
    location: "DLC (Japan Early Buyers)",
    abilities: [267, 289, 305, 311, 375, 377, 292, 296, 218],
    age: "War"
  });
  gMitamas.push({
    id: 196,
    name: "Toyama Kinshiro",
    category: "SPT",
    location: "Manhunter (Normal)",
    abilities: [411, 714, 713, 587, 245, 244, 444, 445, 837],
    age: "Peace"
  });
  gMitamas.push({
    id: 197,
    name: "Toyotomi Hideyoshi",
    category: "SPD",
    location: "Aurogrinder (Normal)",
    abilities: [342, 267, 498, 40, 391, 394, 474, 473, 340],
    age: "War"
  });
  gMitamas.push({
    id: 198,
    name: "Tsukahara Bokuden",
    category: "DEF",
    location: "DLC (Manga: Tsubaki/Kamuna)",
    abilities: [113, 756, 184, 752, 504, 507, 206, 210, 481],
    age: "War"
  });
  gMitamas.push({
    id: 199,
    name: "Tsukuyomi",
    category: "DCT",
    location: "Crocodilus(Expert)",
    abilities: [622, 68, 262, 518, 515, 736, 734, 65, 127],
    age: "Yore"
  });
  gMitamas.push({
    id: 200,
    name: "Tōshūsai Sharaku",
    category: "SPT",
    location: "Venom Queen (Expert)",
    abilities: [226, 247, 708, 244, 614, 619, 363, 362, 696],
    age: "Peace"
  });
  gMitamas.push({
    id: 201,
    name: "Uesugi Harunori",
    category: "SUP",
    location: "Ogre (Expert)",
    abilities: [841, 651, 354, 745, 50, 53, 380, 379, 596],
    age: "Peace"
  });
  gMitamas.push({
    id: 202,
    name: "Uesugi Kenshin",
    category: "PLN",
    location: "Jollux (Story)",
    abilities: [274, 349, 212, 627, 133, 15, 20, 352, 334],
    age: "War"
  });
  gMitamas.push({
    id: 203,
    name: "Unkei",
    category: "SPT",
    location: "Bloodhunter (Expert)",
    abilities: [550, 163, 71, 159, 164, 363, 364, 362, 673],
    age: "Honor"
  });
  gMitamas.push({
    id: 204,
    name: "Ura",
    category: "PLN",
    location: "Free Roam (Sidequest)",
    abilities: [80, 194, 349, 132, 543, 117, 116, 347, 191],
    age: "Yore"
  });
  gMitamas.push({
    id: 205,
    name: "Urashima Taro",
    category: "SPC",
    location: "Tokiwa-no-Orochi (Normal)",
    abilities: [701, 525, 272, 808, 815, 812, 831, 581, 228],
    age: "Yore"
  });
  gMitamas.push({
    id: 206,
    name: "Watanabe no Tsuna",
    category: "SPC",
    location: "Maledictuar (Normal)",
    abilities: [550, 192, 222, 697, 521, 520, 150, 151, 325],
    age: "Grace"
  });
  gMitamas.push({
    id: 207,
    name: "Xavier",
    category: "SUP",
    location: "Wreckbeast (Expert)",
    abilities: [431, 52, 145, 51, 163, 164, 604, 605, 10],
    age: "War"
  });
  gMitamas.push({
    id: 208,
    name: "Yagyu Jubei",
    category: "DCT",
    location: "Bruteclaw (Story)",
    abilities: [792, 569, 572, 735, 608, 612, 147, 150, 270],
    age: "Peace"
  });
  gMitamas.push({
    id: 209,
    name: "Yamana Sōzen",
    category: "LCK",
    location: "Scorpioclaw (Normal)",
    abilities: [259, 260, 616, 19, 393, 395, 295, 562, 626],
    age: "Honor"
  });
  gMitamas.push({
    id: 210,
    name: "Yamato Takeru",
    category: "SPD",
    location: "Crocodilus(Story)",
    abilities: [226, 471, 703, 803, 801, 159, 164, 473, 552],
    age: "Yore"
  });
  gMitamas.push({
    id: 211,
    name: "Yaoya Oshichi",
    category: "PLN",
    location: "Goylespawn (Normal)",
    abilities: [792, 190, 354, 571, 574, 739, 741, 349, 124],
    age: "Peace"
  });
  gMitamas.push({
    id: 212,
    name: "Yoshida Kenkō",
    category: "SPC",
    location: "Bladetail (Expert)",
    abilities: [700, 831, 636, 830, 583, 584, 602, 604, 774],
    age: "War"
  });
  gMitamas.push({
    id: 213,
    name: "Yoshida Shōin",
    category: "SPT",
    location: "Mortabella (Expert)",
    abilities: [531, 194, 321, 320, 319, 360, 363, 365, 251],
    age: "Chaos"
  });
  gMitamas.push({
    id: 214,
    name: "Yoshinaka Kiso",
    category: "SPD",
    location: "Scorpioclaw (Expert)",
    abilities: [497, 230, 354, 36, 238, 800, 794, 29, 74],
    age: "Honor"
  });
  gMitamas.push({
    id: 215,
    name: "Yoshino Dayu",
    category: "SPC",
    location: "Phytodior (Normal)",
    abilities: [494, 671, 665, 666, 669, 209, 211, 210, 105],
    age: "Peace"
  });
  gMitamas.push({
    id: 216,
    name: "Zeami",
    category: "SPT",
    location: "Succuwing (Normal)",
    abilities: [708, 243, 450, 242, 538, 539, 363, 364, 533],
    age: "Honor"
  });
  gMitamas.push({
    id: 217,
    name: "Ōkubo Toshimichi",
    category: "SUP",
    location: "Leohomin (Normal)",
    abilities: [259, 450, 290, 745, 651, 655, 740, 737, 32],
    age: "Chaos"
  });

  gMitamas.sort(sortByName);
}

function initializeBoosts() {
  gBoosts = [];
  gBoosts.getForMitamas = function(mA, mB, mC) {
    var rv = [];

    for (var i = 0; i < gBoosts.length; i++) {
      var currBoost = gBoosts[i];

      var boostValid = true;
      for (var j = 0; j < currBoost.restrictions.length; j++) {
        var restriction = currBoost.restrictions[j];
        switch (restriction.category) {
          case "category":
            boostValid = mA.category === restriction.restriction && mB.category === restriction.restriction && mC.category === restriction.restriction;
            break;
          case "age":
            boostValid = mA.age === restriction.restriction && mB.age === restriction.restriction && mC.age === restriction.restriction;
            break;
          case "mitama":
            boostValid = mA.id === restriction.restriction || mB.id === restriction.restriction || mC.id === restriction.restriction;
            break;
          default:
            break;
        }
        if (!boostValid)
          break;
      }

      if (boostValid)
        rv.push(currBoost);
    }

    return rv;
  }

  // Init entries
  gBoosts.push({
    name: "Triple Set (ATK)",
    boost: "Might (Stock + 1), Leech (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "ATK"
    }]
  });
  gBoosts.push({
    name: "Triple Set (DEF)",
    boost: "Taunt (Stock + 1), Shield (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "DEF"
    }]
  });
  gBoosts.push({
    name: "Triple Set (SPD)",
    boost: "Energy (Stock + 1), Agility (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "SPD"
    }]
  });
  gBoosts.push({
    name: "Triple Set (HLG)",
    boost: "Zeal (Stock + 1), Vitality (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "HLG"
    }]
  });
  gBoosts.push({
    name: "Triple Set (SPT)",
    boost: "Pursuit (Stock + 1), Fountain (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "SPT"
    }]
  });
  gBoosts.push({
    name: "Triple Set (DCT)",
    boost: "Puncture (Stock + 1), Illusion (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "DCT"
    }]
  });
  gBoosts.push({
    name: "Triple Set (SPC)",
    boost: "Warp (Stock + 5), Sanctum (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "SPC"
    }]
  });
  gBoosts.push({
    name: "Triple Set (LCK)",
    boost: "Random (Stock + 1), Fortune (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "LCK"
    }]
  });
  gBoosts.push({
    name: "Triple Set (SUP)",
    boost: "Altruism (Stock + 1), Diffusion (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "SUP"
    }]
  });
  gBoosts.push({
    name: "Triple Set (PLN)",
    boost: "Breaker (Stock + 1), Ablution (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "PLN"
    }]
  });
  gBoosts.push({
    name: "Triple Set (CON)",
    boost: "Follower (Stock + 1), Striker (Stock + 1)",
    restrictions: [{
      category: "category",
      restriction: "CON"
    }]
  });
  gBoosts.push({
    name: "Triple Set (Yore)",
    boost: "Anti-Burn",
    restrictions: [{
      category: "age",
      restriction: "Yore"
    }]
  });
  gBoosts.push({
    name: "Triple Set (Grace)",
    boost: "Anti-Poison",
    restrictions: [{
      category: "age",
      restriction: "Grace"
    }]
  });
  gBoosts.push({
    name: "Triple Set (Honor)",
    boost: "Anti-Frozen",
    restrictions: [{
      category: "age",
      restriction: "Honor"
    }]
  });
  gBoosts.push({
    name: "Triple Set (War)",
    boost: "Anti-Stun",
    restrictions: [{
      category: "age",
      restriction: "War"
    }]
  });
  gBoosts.push({
    name: "Triple Set (Peace)",
    boost: "Anti-Seal",
    restrictions: [{
      category: "age",
      restriction: "Peace"
    }]
  });
  gBoosts.push({
    name: "Triple Set (Chaos)",
    boost: "Anti-Sleep",
    restrictions: [{
      category: "age",
      restriction: "Chaos"
    }]
  });
  gBoosts.push({
    name: "Bonds of Lineage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 0
    }, {
      category: "mitama",
      restriction: 84
    }]
  });
  gBoosts.push({
    name: "Bonds of Lineage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 181
    }, {
      category: "mitama",
      restriction: 102
    }]
  });
  gBoosts.push({
    name: "Bonds of Lineage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 33
    }, {
      category: "mitama",
      restriction: 180
    }]
  });
  gBoosts.push({
    name: "Bonds of Lineage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 103
    }, {
      category: "mitama",
      restriction: 116
    }]
  });
  gBoosts.push({
    name: "Bonds of Lineage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 2
    }, {
      category: "mitama",
      restriction: 50
    }]
  });
  gBoosts.push({
    name: "Bonds of Lineage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 171
    }, {
      category: "mitama",
      restriction: 82
    }]
  });
  gBoosts.push({
    name: "Bonds of Lineage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 34
    }, {
      category: "mitama",
      restriction: 190
    }]
  });
  gBoosts.push({
    name: "Bonds of Lineage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 34
    }, {
      category: "mitama",
      restriction: 98
    }]
  });
  gBoosts.push({
    name: "Bonds of Parentage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 49
    }, {
      category: "mitama",
      restriction: 88
    }]
  });
  gBoosts.push({
    name: "Bonds of Parentage",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 190
    }, {
      category: "mitama",
      restriction: 192
    }]
  });
  gBoosts.push({
    name: "Bonds of Siblinghood",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 132
    }, {
      category: "mitama",
      restriction: 133
    }]
  });
  gBoosts.push({
    name: "Bonds of Siblinghood",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 154
    }, {
      category: "mitama",
      restriction: 155
    }]
  });
  gBoosts.push({
    name: "Bonds of Siblinghood",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 213
    }, {
      category: "mitama",
      restriction: 176
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 210
    }, {
      category: "mitama",
      restriction: 97
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 210
    }, {
      category: "mitama",
      restriction: 95
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 156
    }, {
      category: "mitama",
      restriction: 101
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 116
    }, {
      category: "mitama",
      restriction: 99
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 214
    }, {
      category: "mitama",
      restriction: 105
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 132
    }, {
      category: "mitama",
      restriction: 96
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 126
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 19
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 90
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 114
    }, {
      category: "mitama",
      restriction: 47
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 178
    }, {
      category: "mitama",
      restriction: 93
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 10
    }, {
      category: "mitama",
      restriction: 44
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 81
    }, {
      category: "mitama",
      restriction: 176
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 141
    }, {
      category: "mitama",
      restriction: 155
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 161
    }, {
      category: "mitama",
      restriction: 22
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 160
    }, {
      category: "mitama",
      restriction: 88
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 25
    }, {
      category: "mitama",
      restriction: 94
    }]
  });
  gBoosts.push({
    name: "Bonds of Matrimony",
    boost: "Stamina Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 172
    }, {
      category: "mitama",
      restriction: 18
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 180
    }, {
      category: "mitama",
      restriction: 112
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 116
    }, {
      category: "mitama",
      restriction: 15
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 47
    }, {
      category: "mitama",
      restriction: 203
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 11
    }, {
      category: "mitama",
      restriction: 216
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 55
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 132
    }, {
      category: "mitama",
      restriction: 2
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 132
    }, {
      category: "mitama",
      restriction: 197
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 165
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 80
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 24
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 57
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 25
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 39
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 49
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 80
    }, {
      category: "mitama",
      restriction: 35
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 193
    }, {
      category: "mitama",
      restriction: 140
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 188
    }, {
      category: "mitama",
      restriction: 37
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 194
    }, {
      category: "mitama",
      restriction: 109
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 109
    }, {
      category: "mitama",
      restriction: 127
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 113
    }, {
      category: "mitama",
      restriction: 30
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 186
    }, {
      category: "mitama",
      restriction: 159
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 160
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 161
    }, {
      category: "mitama",
      restriction: 163
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 109
    }, {
      category: "mitama",
      restriction: 123
    }]
  });
  gBoosts.push({
    name: "Bonds of Fealty",
    boost: "Verity Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 186
    }, {
      category: "mitama",
      restriction: 23
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 95
    }, {
      category: "mitama",
      restriction: 4
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 186
    }, {
      category: "mitama",
      restriction: 55
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 161
    }, {
      category: "mitama",
      restriction: 35
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 72
    }, {
      category: "mitama",
      restriction: 150
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 106
    }, {
      category: "mitama",
      restriction: 124
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 124
    }, {
      category: "mitama",
      restriction: 57
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 72
    }, {
      category: "mitama",
      restriction: 150
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 185
    }, {
      category: "mitama",
      restriction: 81
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 145
    }, {
      category: "mitama",
      restriction: 174
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 79
    }, {
      category: "mitama",
      restriction: 149
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 143
    }, {
      category: "mitama",
      restriction: 155
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 141
    }, {
      category: "mitama",
      restriction: 143
    }]
  });
  gBoosts.push({
    name: "Bonds of Cordiality",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 126
    }, {
      category: "mitama",
      restriction: 108
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 156
    }, {
      category: "mitama",
      restriction: 14
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 0
    }, {
      category: "mitama",
      restriction: 13
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 181
    }, {
      category: "mitama",
      restriction: 28
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 113
    }, {
      category: "mitama",
      restriction: 170
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 114
    }, {
      category: "mitama",
      restriction: 116
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 114
    }, {
      category: "mitama",
      restriction: 181
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 114
    }, {
      category: "mitama",
      restriction: 180
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 9
    }, {
      category: "mitama",
      restriction: 83
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 116
    }, {
      category: "mitama",
      restriction: 182
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 132
    }, {
      category: "mitama",
      restriction: 55
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 132
    }, {
      category: "mitama",
      restriction: 151
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 161
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 57
    }]
  });
  gBoosts.push({
    name: "Worthy Rivals",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 118
    }, {
      category: "mitama",
      restriction: 169
    }]
  });
  gBoosts.push({
    name: "Bonds of Tutelage",
    boost: "Elemental Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 54
    }, {
      category: "mitama",
      restriction: 66
    }]
  });
  gBoosts.push({
    name: "Bonds of Tutelage",
    boost: "Elemental Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 0
    }, {
      category: "mitama",
      restriction: 71
    }]
  });
  gBoosts.push({
    name: "Bonds of Tutelage",
    boost: "Elemental Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 170
    }, {
      category: "mitama",
      restriction: 52
    }]
  });
  gBoosts.push({
    name: "Bonds of Tutelage",
    boost: "Elemental Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 208
    }, {
      category: "mitama",
      restriction: 190
    }]
  });
  gBoosts.push({
    name: "Bonds of Tutelage",
    boost: "Elemental Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 12
    }, {
      category: "mitama",
      restriction: 198
    }]
  });
  gBoosts.push({
    name: "Way of the Sword",
    boost: "Gouge Master",
    restrictions: [{
      category: "mitama",
      restriction: 69
    }, {
      category: "mitama",
      restriction: 118
    }, {
      category: "mitama",
      restriction: 208
    }]
  });
  gBoosts.push({
    name: "Dual Wield",
    boost: "Breakthrough",
    restrictions: [{
      category: "mitama",
      restriction: 129
    }, {
      category: "mitama",
      restriction: 118
    }, {
      category: "mitama",
      restriction: 101
    }]
  });
  gBoosts.push({
    name: "Way of the Spear",
    boost: "Willpower",
    restrictions: [{
      category: "mitama",
      restriction: 35
    }, {
      category: "mitama",
      restriction: 49
    }, {
      category: "mitama",
      restriction: 161
    }]
  });
  gBoosts.push({
    name: "Faithful",
    boost: "Willpower",
    restrictions: [{
      category: "mitama",
      restriction: 47
    }, {
      category: "mitama",
      restriction: 44
    }, {
      category: "mitama",
      restriction: 19
    }]
  });
  gBoosts.push({
    name: "Way of the Fist",
    boost: "Incandescence",
    restrictions: [{
      category: "mitama",
      restriction: 130
    }, {
      category: "mitama",
      restriction: 157
    }, {
      category: "mitama",
      restriction: 148
    }]
  });
  gBoosts.push({
    name: "Way of the Chain",
    boost: "Infusion",
    restrictions: [{
      category: "mitama",
      restriction: 169
    }, {
      category: "mitama",
      restriction: 39
    }, {
      category: "mitama",
      restriction: 162
    }]
  });
  gBoosts.push({
    name: "Way of the Bow",
    boost: "Conduction",
    restrictions: [{
      category: "mitama",
      restriction: 125
    }, {
      category: "mitama",
      restriction: 111
    }, {
      category: "mitama",
      restriction: 87
    }]
  });
  gBoosts.push({
    name: "Demon Watchmen",
    boost: "Muscle-bound",
    restrictions: [{
      category: "mitama",
      restriction: 204
    }, {
      category: "mitama",
      restriction: 170
    }, {
      category: "mitama",
      restriction: 52
    }]
  });
  gBoosts.push({
    name: "Way of the Naginata",
    boost: "Butterfly Dance",
    restrictions: [{
      category: "mitama",
      restriction: 15
    }, {
      category: "mitama",
      restriction: 20
    }]
  });
  gBoosts.push({
    name: "Way of the Rifle",
    boost: "Reloading Speed+",
    restrictions: [{
      category: "mitama",
      restriction: 151
    }, {
      category: "mitama",
      restriction: 132
    }]
  });
  gBoosts.push({
    name: "Shield the weak",
    boost: "Mindtrap",
    restrictions: [{
      category: "mitama",
      restriction: 181
    }, {
      category: "mitama",
      restriction: 64
    }, {
      category: "mitama",
      restriction: 142
    }]
  });
  gBoosts.push({
    name: "Everlasting Talent",
    boost: "Heavenly Blow",
    restrictions: [{
      category: "mitama",
      restriction: 178
    }, {
      category: "mitama",
      restriction: 28
    }, {
      category: "mitama",
      restriction: 96
    }]
  });
  gBoosts.push({
    name: "Satsuma Samurai",
    boost: "Lifebringer",
    restrictions: [{
      category: "mitama",
      restriction: 150
    }, {
      category: "mitama",
      restriction: 217
    }]
  });
  gBoosts.push({
    name: "Camellia theory Yumiharizuki",
    boost: "Convergence",
    restrictions: [{
      category: "mitama",
      restriction: 111
    }, {
      category: "mitama",
      restriction: 74
    }]
  });
  gBoosts.push({
    name: "Monthly Night",
    boost: "Vanishing mist",
    restrictions: [{
      category: "mitama",
      restriction: 89
    }, {
      category: "mitama",
      restriction: 199
    }]
  });
  gBoosts.push({
    name: "Treasure Hunters",
    boost: "Greed",
    restrictions: [{
      category: "mitama",
      restriction: 89
    }, {
      category: "mitama",
      restriction: 27
    }]
  });
  gBoosts.push({
    name: "Gold and Silver",
    boost: "Haku Collector",
    restrictions: [{
      category: "mitama",
      restriction: 11
    }, {
      category: "mitama",
      restriction: 10
    }]
  });
  gBoosts.push({
    name: "Ten Thousand Bill",
    boost: "Haku Enthusiast",
    restrictions: [{
      category: "mitama",
      restriction: 32
    }, {
      category: "mitama",
      restriction: 145
    }, {
      category: "mitama",
      restriction: 120
    }]
  });
  gBoosts.push({
    name: "Koban",
    boost: "Haku Enthusiast",
    restrictions: [{
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 5
    }]
  });
  gBoosts.push({
    name: "The old bills",
    boost: "Haku Enthusiast",
    restrictions: [{
      category: "mitama",
      restriction: 210
    }, {
      category: "mitama",
      restriction: 29
    }, {
      category: "mitama",
      restriction: 83
    }]
  });
  gBoosts.push({
    name: "Historical Drama",
    boost: "Haku Enthusiast",
    restrictions: [{
      category: "mitama",
      restriction: 37
    }, {
      category: "mitama",
      restriction: 193
    }, {
      category: "mitama",
      restriction: 117
    }]
  });
  gBoosts.push({
    name: "Tomb Eji",
    boost: "Novice Destroyer",
    restrictions: [{
      category: "mitama",
      restriction: 153
    }, {
      category: "mitama",
      restriction: 189
    }]
  });
  gBoosts.push({
    name: "Battlefield of beauty",
    boost: "Novice Destroyer",
    restrictions: [{
      category: "mitama",
      restriction: 64
    }]
  });
  gBoosts.push({
    name: "Restoration Heroes",
    boost: "Expert Destroyer",
    restrictions: [{
      category: "mitama",
      restriction: 150
    }, {
      category: "mitama",
      restriction: 73
    }, {
      category: "mitama",
      restriction: 217
    }]
  });
  gBoosts.push({
    name: "Shinsengumi Leaders",
    boost: "Expert Destroyer",
    restrictions: [{
      category: "mitama",
      restriction: 137
    }, {
      category: "mitama",
      restriction: 153
    }, {
      category: "mitama",
      restriction: 189
    }]
  });
  gBoosts.push({
    name: "Asakura Norikage story Symbol",
    boost: "Expert Destroyer",
    restrictions: [{
      category: "mitama",
      restriction: 202
    }, {
      category: "mitama",
      restriction: 186
    }]
  });
  gBoosts.push({
    name: "Motto of the samurai",
    boost: "Charity",
    restrictions: [{
      category: "mitama",
      restriction: 121
    }, {
      category: "mitama",
      restriction: 107
    }, {
      category: "mitama",
      restriction: 201
    }]
  });
  gBoosts.push({
    name: "Reconciliation",
    boost: "Charity",
    restrictions: [{
      category: "mitama",
      restriction: 61
    }, {
      category: "mitama",
      restriction: 62
    }, {
      category: "mitama",
      restriction: 92
    }]
  });
  gBoosts.push({
    name: "Dragon Killers",
    boost: "Insight",
    restrictions: [{
      category: "mitama",
      restriction: 178
    }, {
      category: "mitama",
      restriction: 16
    }, {
      category: "mitama",
      restriction: 172
    }]
  });
  gBoosts.push({
    name: "Legendary Kings",
    boost: "Insight",
    restrictions: [{
      category: "mitama",
      restriction: 7
    }, {
      category: "mitama",
      restriction: 16
    }, {
      category: "mitama",
      restriction: 172
    }]
  });
  gBoosts.push({
    name: "Ghost Busters",
    boost: "Insight",
    restrictions: [{
      category: "mitama",
      restriction: 28
    }, {
      category: "mitama",
      restriction: 113
    }, {
      category: "mitama",
      restriction: 112
    }]
  });
  gBoosts.push({
    name: "Demon Nicknames",
    boost: "Insight",
    restrictions: [{
      category: "mitama",
      restriction: 5
    }, {
      category: "mitama",
      restriction: 24
    }, {
      category: "mitama",
      restriction: 37
    }]
  });
  gBoosts.push({
    name: "Gods of Thunder",
    boost: "Dissection (Focus)",
    restrictions: [{
      category: "mitama",
      restriction: 175
    }, {
      category: "mitama",
      restriction: 136
    }]
  });
  gBoosts.push({
    name: "Case of the tail wagging the dog",
    boost: "Frontal Assault",
    restrictions: [{
      category: "mitama",
      restriction: 51
    }, {
      category: "mitama",
      restriction: 121
    }]
  });
  gBoosts.push({
    name: "Overcoming weak hands",
    boost: "Frontal Assault",
    restrictions: [{
      category: "mitama",
      restriction: 147
    }, {
      category: "mitama",
      restriction: 134
    }]
  });
  gBoosts.push({
    name: "Sacred Sword",
    boost: "Piety Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 210
    }, {
      category: "mitama",
      restriction: 104
    }]
  });
  gBoosts.push({
    name: "Records of Ancient Matters",
    boost: "Piety Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 27
    }, {
      category: "mitama",
      restriction: 40
    }]
  });
  gBoosts.push({
    name: "Lord Shikioni",
    boost: "Piety Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 26
    }, {
      category: "mitama",
      restriction: 0
    }]
  });
  gBoosts.push({
    name: "Sugawara family",
    boost: "Piety Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 130
    }, {
      category: "mitama",
      restriction: 175
    }, {
      category: "mitama",
      restriction: 183
    }]
  });
  gBoosts.push({
    name: "3 Great Teachings",
    boost: "Piety Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 25
    }, {
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 117
    }]
  });
  gBoosts.push({
    name: "Voice of God",
    boost: "Protection of Heroes",
    restrictions: [{
      category: "mitama",
      restriction: 64
    }, {
      category: "mitama",
      restriction: 3
    }]
  });
  gBoosts.push({
    name: "Doggy",
    boost: "Restart",
    restrictions: [{
      category: "mitama",
      restriction: 119
    }, {
      category: "mitama",
      restriction: 192
    }, {
      category: "mitama",
      restriction: 86
    }]
  });
  gBoosts.push({
    name: "Ansei Purge",
    boost: "Conviction",
    restrictions: [{
      category: "mitama",
      restriction: 53
    }, {
      category: "mitama",
      restriction: 213
    }]
  });
  gBoosts.push({
    name: "Stigma give up",
    boost: "Chance",
    restrictions: [{
      category: "mitama",
      restriction: 181
    }, {
      category: "mitama",
      restriction: 9
    }]
  });
  gBoosts.push({
    name: "Extremely the road and who",
    boost: "Evasion",
    restrictions: [{
      category: "mitama",
      restriction: 68
    }, {
      category: "mitama",
      restriction: 175
    }, {
      category: "mitama",
      restriction: 165
    }]
  });
  gBoosts.push({
    name: "Kabuki's",
    boost: "Transposition (Attributes)",
    restrictions: [{
      category: "mitama",
      restriction: 63
    }, {
      category: "mitama",
      restriction: 106
    }, {
      category: "mitama",
      restriction: 58
    }]
  });
  gBoosts.push({
    name: "Sanada family",
    boost: "Precision increase from back attacks",
    restrictions: [{
      category: "mitama",
      restriction: 161
    }, {
      category: "mitama",
      restriction: 160
    }, {
      category: "mitama",
      restriction: 159
    }]
  });
  gBoosts.push({
    name: "Red and Blue",
    boost: "Precision increase from back attacks",
    restrictions: [{
      category: "mitama",
      restriction: 161
    }, {
      category: "mitama",
      restriction: 195
    }]
  });
  gBoosts.push({
    name: "Ranpo doctor",
    boost: "Recovery+ (Range)",
    restrictions: [{
      category: "mitama",
      restriction: 177
    }, {
      category: "mitama",
      restriction: 82
    }, {
      category: "mitama",
      restriction: 171
    }]
  });
  gBoosts.push({
    name: "Demon Vixen",
    boost: "Recovery+ (Bonus)",
    restrictions: [{
      category: "mitama",
      restriction: 84
    }, {
      category: "mitama",
      restriction: 187
    }]
  });
  gBoosts.push({
    name: "Christian Saints",
    boost: "Recovery (Stock +1)",
    restrictions: [{
      category: "mitama",
      restriction: 207
    }, {
      category: "mitama",
      restriction: 64
    }]
  });
  gBoosts.push({
    name: "Inner Palace",
    boost: "Recovery (Stock +1)",
    restrictions: [{
      category: "mitama",
      restriction: 91
    }, {
      category: "mitama",
      restriction: 85
    }]
  });
  gBoosts.push({
    name: "Councilors",
    boost: "Recovery (Stock + 2)",
    restrictions: [{
      category: "mitama",
      restriction: 107
    }, {
      category: "mitama",
      restriction: 188
    }, {
      category: "mitama",
      restriction: 53
    }]
  });
  gBoosts.push({
    name: "Wives of the Shogun",
    boost: "Recovery (Stock + 2)",
    restrictions: [{
      category: "mitama",
      restriction: 47
    }, {
      category: "mitama",
      restriction: 44
    }, {
      category: "mitama",
      restriction: 34
    }]
  });
  gBoosts.push({
    name: "Dedicated Prayers",
    boost: "Recovery (Stock + 2)",
    restrictions: [{
      category: "mitama",
      restriction: 207
    }, {
      category: "mitama",
      restriction: 80
    }, {
      category: "mitama",
      restriction: 50
    }]
  });
  gBoosts.push({
    name: "Peerless Beauties",
    boost: "Recovery (Stock + 2)",
    restrictions: [{
      category: "mitama",
      restriction: 100
    }, {
      category: "mitama",
      restriction: 139
    }, {
      category: "mitama",
      restriction: 133
    }]
  });
  gBoosts.push({
    name: "Iga's",
    boost: "Swiftness",
    restrictions: [{
      category: "mitama",
      restriction: 39
    }, {
      category: "mitama",
      restriction: 58
    }, {
      category: "mitama",
      restriction: 110
    }]
  });
  gBoosts.push({
    name: "Model of the steam locomotive",
    boost: "Swiftness",
    restrictions: [{
      category: "mitama",
      restriction: 1
    }, {
      category: "mitama",
      restriction: 46
    }]
  });
  gBoosts.push({
    name: "Stage Actors",
    boost: "Lure",
    restrictions: [{
      category: "mitama",
      restriction: 216
    }, {
      category: "mitama",
      restriction: 63
    }]
  });
  gBoosts.push({
    name: "Geishas",
    boost: "Lure",
    restrictions: [{
      category: "mitama",
      restriction: 66
    }, {
      category: "mitama",
      restriction: 215
    }, {
      category: "mitama",
      restriction: 152
    }]
  });
  gBoosts.push({
    name: "Master carpenter of Genji",
    boost: "Fitness Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 113
    }, {
      category: "mitama",
      restriction: 115
    }, {
      category: "mitama",
      restriction: 114
    }]
  });
  gBoosts.push({
    name: "Taira Clan",
    boost: "Fitness Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 182
    }, {
      category: "mitama",
      restriction: 180
    }, {
      category: "mitama",
      restriction: 179
    }]
  });
  gBoosts.push({
    name: "Shinsengumi",
    boost: "Fitness Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 76
    }, {
      category: "mitama",
      restriction: 41
    }, {
      category: "mitama",
      restriction: 137
    }]
  });
  gBoosts.push({
    name: "Ashikaga Shogun",
    boost: "Fitness Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 12
    }, {
      category: "mitama",
      restriction: 11
    }, {
      category: "mitama",
      restriction: 10
    }]
  });
  gBoosts.push({
    name: "Tokugawa Shogun",
    boost: "Fitness Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 190
    }, {
      category: "mitama",
      restriction: 192
    }]
  });
  gBoosts.push({
    name: "Fairy Tales",
    boost: "Fitness Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 119
    }, {
      category: "mitama",
      restriction: 205
    }, {
      category: "mitama",
      restriction: 59
    }]
  });
  gBoosts.push({
    name: "Shogunate Founders",
    boost: "Fitness Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 114
    }, {
      category: "mitama",
      restriction: 9
    }, {
      category: "mitama",
      restriction: 191
    }]
  });
  gBoosts.push({
    name: "Three Feudal Heroes",
    boost: "Fitness Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 132
    }, {
      category: "mitama",
      restriction: 197
    }, {
      category: "mitama",
      restriction: 191
    }]
  });
  gBoosts.push({
    name: "Kim",
    boost: "Fitness Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 157
    }, {
      category: "mitama",
      restriction: 196
    }, {
      category: "mitama",
      restriction: 128
    }]
  });
  gBoosts.push({
    name: "Siege of Osaka",
    boost: "Fitness Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 161
    }, {
      category: "mitama",
      restriction: 25
    }]
  });
  gBoosts.push({
    name: "Atsumori",
    boost: "Verity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 132
    }, {
      category: "mitama",
      restriction: 179
    }]
  });
  gBoosts.push({
    name: "Four Heavenly Kings",
    boost: "Verity Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 113
    }, {
      category: "mitama",
      restriction: 206
    }, {
      category: "mitama",
      restriction: 157
    }]
  });
  gBoosts.push({
    name: "Taika Reforms",
    boost: "Affliction Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 144
    }, {
      category: "mitama",
      restriction: 29
    }, {
      category: "mitama",
      restriction: 173
    }]
  });
  gBoosts.push({
    name: "Active Life",
    boost: "Exuberance",
    restrictions: [{
      category: "mitama",
      restriction: 8
    }, {
      category: "mitama",
      restriction: 51
    }, {
      category: "mitama",
      restriction: 74
    }]
  });
  gBoosts.push({
    name: "Onin War",
    boost: "Devotion",
    restrictions: [{
      category: "mitama",
      restriction: 10
    }, {
      category: "mitama",
      restriction: 44
    }, {
      category: "mitama",
      restriction: 209
    }]
  });
  gBoosts.push({
    name: "Way of the Ninja",
    boost: "Agility (Stock +2)",
    restrictions: [{
      category: "mitama",
      restriction: 39
    }, {
      category: "mitama",
      restriction: 78
    }]
  });
  gBoosts.push({
    name: "Clever writing",
    boost: "Attack Up Lv1, Protection Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 202
    }, {
      category: "mitama",
      restriction: 186
    }]
  });
  gBoosts.push({
    name: "Great Ladies",
    boost: "Attack Up",
    restrictions: [{
      category: "mitama",
      restriction: 99
    }, {
      category: "mitama",
      restriction: 101
    }, {
      category: "mitama",
      restriction: 103
    }]
  });
  gBoosts.push({
    name: "Shinto chagrin flow",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 73
    }, {
      category: "mitama",
      restriction: 122
    }]
  });
  gBoosts.push({
    name: "Demon Repulsion",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 119
    }, {
      category: "mitama",
      restriction: 204
    }]
  });
  gBoosts.push({
    name: "Conqueror Shogun",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 9
    }, {
      category: "mitama",
      restriction: 214
    }]
  });
  gBoosts.push({
    name: "Bishamonten image",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 203
    }, {
      category: "mitama",
      restriction: 17
    }]
  });
  gBoosts.push({
    name: "Summer grass",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 110
    }, {
      category: "mitama",
      restriction: 116
    }]
  });
  gBoosts.push({
    name: "Doroashi Bishamonten",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 202
    }, {
      category: "mitama",
      restriction: 17
    }]
  });
  gBoosts.push({
    name: "Incarnation of Bishamonten",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 209
    }, {
      category: "mitama",
      restriction: 17
    }]
  });
  gBoosts.push({
    name: "Shigisan",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 145
    }, {
      category: "mitama",
      restriction: 17
    }]
  });
  gBoosts.push({
    name: "Grand Sumo",
    boost: "Attack Up Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 130
    }, {
      category: "mitama",
      restriction: 148
    }]
  });
  gBoosts.push({
    name: "Shinkage-ryū ",
    boost: "Attack Up Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 69
    }, {
      category: "mitama",
      restriction: 208
    }, {
      category: "mitama",
      restriction: 184
    }]
  });
  gBoosts.push({
    name: "Nothern Lands",
    boost: "Attack Up Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 14
    }, {
      category: "mitama",
      restriction: 167
    }, {
      category: "mitama",
      restriction: 136
    }]
  });
  gBoosts.push({
    name: "Great Warriors",
    boost: "Attack Up Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 15
    }, {
      category: "mitama",
      restriction: 111
    }, {
      category: "mitama",
      restriction: 49
    }]
  });
  gBoosts.push({
    name: "Brave Women",
    boost: "Attack Up Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 87
    }, {
      category: "mitama",
      restriction: 88
    }]
  });
  gBoosts.push({
    name: "Hokushin Itto-ryu",
    boost: "Attack Up Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 20
    }, {
      category: "mitama",
      restriction: 21
    }, {
      category: "mitama",
      restriction: 189
    }]
  });
  gBoosts.push({
    name: "Brought over people",
    boost: "Attack Up Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 65
    }, {
      category: "mitama",
      restriction: 207
    }, {
      category: "mitama",
      restriction: 171
    }]
  });
  gBoosts.push({
    name: "World five sword",
    boost: "Attack Up Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 156
    }, {
      category: "mitama",
      restriction: 113
    }, {
      category: "mitama",
      restriction: 129
    }]
  });
  gBoosts.push({
    name: "Women of Aizu",
    boost: "Attack Up Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 123
    }, {
      category: "mitama",
      restriction: 127
    }]
  });
  gBoosts.push({
    name: "Beginning & End",
    boost: "Protection Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 191
    }, {
      category: "mitama",
      restriction: 194
    }]
  });
  gBoosts.push({
    name: "Tale of Genji",
    boost: "Protection Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 120
    }, {
      category: "mitama",
      restriction: 42
    }]
  });
  gBoosts.push({
    name: "Battle of Wits",
    boost: "Protection Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 11
    }, {
      category: "mitama",
      restriction: 54
    }]
  });
  gBoosts.push({
    name: "Ukiyo-zōshi",
    boost: "Protection Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 215
    }, {
      category: "mitama",
      restriction: 211
    }]
  });
  gBoosts.push({
    name: "Lantern Oiwa",
    boost: "Protection Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 74
    }, {
      category: "mitama",
      restriction: 134
    }]
  });
  gBoosts.push({
    name: "Queens of Yamato",
    boost: "Tolerance Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 43
    }, {
      category: "mitama",
      restriction: 60
    }]
  });
  gBoosts.push({
    name: "Creation of Heaven & Earth",
    boost: "Tolerance Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 61
    }, {
      category: "mitama",
      restriction: 62
    }]
  });
  gBoosts.push({
    name: "Descent From Heaven",
    boost: "Tolerance Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 4
    }, {
      category: "mitama",
      restriction: 162
    }]
  });
  gBoosts.push({
    name: "Enchantresses",
    boost: "Tolerance Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 102
    }, {
      category: "mitama",
      restriction: 187
    }, {
      category: "mitama",
      restriction: 101
    }]
  });
  gBoosts.push({
    name: "Women of Sengoku",
    boost: "Stamina Lv1, Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 133
    }, {
      category: "mitama",
      restriction: 19
    }, {
      category: "mitama",
      restriction: 38
    }]
  });
  gBoosts.push({
    name: "Shinto Trinity",
    boost: "Stamina Lv1, Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 4
    }, {
      category: "mitama",
      restriction: 199
    }, {
      category: "mitama",
      restriction: 178
    }]
  });
  gBoosts.push({
    name: "Taro",
    boost: "Stamina Lv1, Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 119
    }, {
      category: "mitama",
      restriction: 157
    }, {
      category: "mitama",
      restriction: 205
    }]
  });
  gBoosts.push({
    name: "Matsudaira Aizu house",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 107
    }, {
      category: "mitama",
      restriction: 109
    }]
  });
  gBoosts.push({
    name: "Azuchimomoyama culture",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 63
    }, {
      category: "mitama",
      restriction: 165
    }]
  });
  gBoosts.push({
    name: "Mysterious Origins",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 89
    }, {
      category: "mitama",
      restriction: 119
    }]
  });
  gBoosts.push({
    name: "Ruler of virtue",
    boost: "Stamina Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 107
    }, {
      category: "mitama",
      restriction: 117
    }, {
      category: "mitama",
      restriction: 201
    }]
  });
  gBoosts.push({
    name: "Kamakura culture",
    boost: "Stamina Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 31
    }, {
      category: "mitama",
      restriction: 203
    }, {
      category: "mitama",
      restriction: 70
    }]
  });
  gBoosts.push({
    name: "Muromachi culture",
    boost: "Stamina Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 216
    }, {
      category: "mitama",
      restriction: 166
    }, {
      category: "mitama",
      restriction: 79
    }]
  });
  gBoosts.push({
    name: "Caustic culture",
    boost: "Stamina Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 142
    }, {
      category: "mitama",
      restriction: 177
    }, {
      category: "mitama",
      restriction: 45
    }]
  });
  gBoosts.push({
    name: "Eternal Bonds",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 202
    }, {
      category: "mitama",
      restriction: 124
    }]
  });
  gBoosts.push({
    name: "Atsuta Shrine",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 95
    }, {
      category: "mitama",
      restriction: 4
    }]
  });
  gBoosts.push({
    name: "Benefactors",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 24
    }, {
      category: "mitama",
      restriction: 91
    }]
  });
  gBoosts.push({
    name: "Tale of Eight Dogs",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 26
    }, {
      category: "mitama",
      restriction: 86
    }]
  });
  gBoosts.push({
    name: "Agi and bruises",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 185
    }, {
      category: "mitama",
      restriction: 155
    }]
  });
  gBoosts.push({
    name: "Coach of the Dynasty",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 83
    }, {
      category: "mitama",
      restriction: 129
    }]
  });
  gBoosts.push({
    name: "Way of the bandit",
    boost: "Application Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 58
    }, {
      category: "mitama",
      restriction: 78
    }]
  });
  gBoosts.push({
    name: "Famous Magistrates",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 140
    }, {
      category: "mitama",
      restriction: 196
    }]
  });
  gBoosts.push({
    name: "Well-traveled",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 166
    }, {
      category: "mitama",
      restriction: 110
    }, {
      category: "mitama",
      restriction: 56
    }]
  });
  gBoosts.push({
    name: "Map of Japan",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 56
    }, {
      category: "mitama",
      restriction: 171
    }, {
      category: "mitama",
      restriction: 72
    }]
  });
  gBoosts.push({
    name: "Tosa loyalist party",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 135
    }, {
      category: "mitama",
      restriction: 185
    }]
  });
  gBoosts.push({
    name: "Envoys",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 65
    }, {
      category: "mitama",
      restriction: 149
    }, {
      category: "mitama",
      restriction: 175
    }]
  });
  gBoosts.push({
    name: "Shoka School",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 213
    }, {
      category: "mitama",
      restriction: 184
    }, {
      category: "mitama",
      restriction: 81
    }]
  });
  gBoosts.push({
    name: "Private School Founders",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 171
    }, {
      category: "mitama",
      restriction: 158
    }, {
      category: "mitama",
      restriction: 213
    }]
  });
  gBoosts.push({
    name: "May School",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 158
    }, {
      category: "mitama",
      restriction: 72
    }, {
      category: "mitama",
      restriction: 213
    }]
  });
  gBoosts.push({
    name: "Across the sea",
    boost: "Application Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 138
    }, {
      category: "mitama",
      restriction: 149
    }, {
      category: "mitama",
      restriction: 79
    }]
  });
  gBoosts.push({
    name: "Edo Rebellion",
    boost: "Relaxation",
    restrictions: [{
      category: "mitama",
      restriction: 142
    }, {
      category: "mitama",
      restriction: 3
    }, {
      category: "mitama",
      restriction: 167
    }]
  });
  gBoosts.push({
    name: "Lamentation",
    boost: "Relaxation",
    restrictions: [{
      category: "mitama",
      restriction: 175
    }, {
      category: "mitama",
      restriction: 181
    }, {
      category: "mitama",
      restriction: 134
    }]
  });
  gBoosts.push({
    name: "Manyo poet",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 146
    }, {
      category: "mitama",
      restriction: 68
    }]
  });
  gBoosts.push({
    name: "Waka three God",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 100
    }, {
      category: "mitama",
      restriction: 68
    }]
  });
  gBoosts.push({
    name: "History Books",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 5
    }, {
      category: "mitama",
      restriction: 117
    }, {
      category: "mitama",
      restriction: 40
    }]
  });
  gBoosts.push({
    name: "Woodblock Printers",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 200
    }, {
      category: "mitama",
      restriction: 74
    }]
  });
  gBoosts.push({
    name: "Six Immortal Poets",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 6
    }, {
      category: "mitama",
      restriction: 139
    }]
  });
  gBoosts.push({
    name: "Dutch Studies",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 177
    }, {
      category: "mitama",
      restriction: 32
    }, {
      category: "mitama",
      restriction: 45
    }]
  });
  gBoosts.push({
    name: "Ya Naru female literature",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 164
    }, {
      category: "mitama",
      restriction: 120
    }, {
      category: "mitama",
      restriction: 183
    }]
  });
  gBoosts.push({
    name: "3 Great Essayists",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 164
    }, {
      category: "mitama",
      restriction: 70
    }, {
      category: "mitama",
      restriction: 212
    }]
  });
  gBoosts.push({
    name: "Diary's Literature",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 75
    }, {
      category: "mitama",
      restriction: 120
    }, {
      category: "mitama",
      restriction: 183
    }]
  });
  gBoosts.push({
    name: "Patriarch",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 26
    }, {
      category: "mitama",
      restriction: 65
    }, {
      category: "mitama",
      restriction: 149
    }]
  });
  gBoosts.push({
    name: "36 Immortal Poets",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 68
    }, {
      category: "mitama",
      restriction: 139
    }, {
      category: "mitama",
      restriction: 75
    }]
  });
  gBoosts.push({
    name: "Inventors",
    boost: "Lifesaver",
    restrictions: [{
      category: "mitama",
      restriction: 45
    }, {
      category: "mitama",
      restriction: 46
    }]
  });
  gBoosts.push({
    name: "Comeback",
    boost: "Tenacity",
    restrictions: [{
      category: "mitama",
      restriction: 116
    }, {
      category: "mitama",
      restriction: 121
    }, {
      category: "mitama",
      restriction: 132
    }]
  });
  gBoosts.push({
    name: "Up in flames",
    boost: "Tenacity",
    restrictions: [{
      category: "mitama",
      restriction: 77
    }, {
      category: "mitama",
      restriction: 97
    }, {
      category: "mitama",
      restriction: 64
    }]
  });
  gBoosts.push({
    name: "Vow of revenge",
    boost: "Tenacity",
    restrictions: [{
      category: "mitama",
      restriction: 181
    }, {
      category: "mitama",
      restriction: 165
    }, {
      category: "mitama",
      restriction: 58
    }]
  });
  gBoosts.push({
    name: "The Soga Clan",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 174
    }, {
      category: "mitama",
      restriction: 173
    }]
  });
  gBoosts.push({
    name: "Settsu Genji",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 113
    }, {
      category: "mitama",
      restriction: 112
    }]
  });
  gBoosts.push({
    name: "Hojo Regents",
    boost: "Divinity Lv1",
    restrictions: [{
      category: "mitama",
      restriction: 47
    }, {
      category: "mitama",
      restriction: 48
    }]
  });
  gBoosts.push({
    name: "San'aneototo Ties",
    boost: "Divinity Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 190
    }, {
      category: "mitama",
      restriction: 98
    }, {
      category: "mitama",
      restriction: 107
    }]
  });
  gBoosts.push({
    name: "House of Fujiwara",
    boost: "Divinity Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 27
    }, {
      category: "mitama",
      restriction: 30
    }, {
      category: "mitama",
      restriction: 29
    }]
  });
  gBoosts.push({
    name: "Taiseihokan",
    boost: "Divinity Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 194
    }, {
      category: "mitama",
      restriction: 150
    }]
  });
  gBoosts.push({
    name: "Kanrin Maru",
    boost: "Divinity Lv2",
    restrictions: [{
      category: "mitama",
      restriction: 72
    }, {
      category: "mitama",
      restriction: 168
    }, {
      category: "mitama",
      restriction: 67
    }]
  });
  gBoosts.sort(sortByName);
}

function sortByName(a, b) {
  if (!a.name || !b.name) {
    debugger;
  }
  var aUC = a.name ? a.name.toUpperCase() : '';
  var bUC = b.name ? b.name.toUpperCase() : '';
  if (aUC < bUC)
    return -1;
  else if (aUC > bUC)
    return 1;
  else
    return 0;
}
