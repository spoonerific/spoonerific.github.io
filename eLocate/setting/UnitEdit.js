/*global define*/
define(
  ['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/dom-style',
  'dojo/on',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'dojo/text!./UnitEdit.html',
  'jimu/SpatialReference/utils',
  'dijit/registry',
  'dojo/query',
  'jimu/dijit/RadioBtn',
  'dijit/form/TextBox'
  ],
  function(
    declare,
    lang,
    domStyle,
    on,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    template,
    utils,
    registry,
    query) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'unit-edit',
      templateString: template,
      config:null,
      tr:null,
      popup: null,
      adding: false,
      currentWkid: null,
      wgs84Opt: '',
      currentTfWkid: null,
      transformDir: '',

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        this.set('wgs84Opt', '');
        this.set('transformDir', '');

        if(!this.config){
          this.popup.disableButton(0);
        }

        this.own(on(this.wgsOptDD, 'click', lang.hitch(this, function() {
          this.set('wgs84Opt', 'dd');
        })));
        this.own(on(this.wgsOptDMS, 'click', lang.hitch(this, function() {
          this.set('wgs84Opt', 'dms');
        })));
        this.own(on(this.wgsOptDM, 'click', lang.hitch(this, function() {
          this.set('wgs84Opt', 'dm');
        })));
        this.own(on(this.wgsOptDDM, 'click', lang.hitch(this, function() {
          this.set('wgs84Opt', 'ddm');
        })));

        this.own(on(this.tforwardNode, 'click', lang.hitch(this, function() {
          this.set('transformDir', 'forward');
        })));
        this.own(on(this.treverseNode, 'click', lang.hitch(this, function() {
          this.set('transformDir', 'reverse');
        })));

        this.watch('wgs84Opt', this._updateWGSOpt);
        this.watch('transformDir', this._updateTransformDir);
        this._setConfig(this.config);
      },

      _updateTransformDir: function(){
        var _selectedDirNode = null;
        var _Dir = this.get('transformDir');
        if (_Dir === 'forward') {
          _selectedDirNode = this.tforwardNode;
        } else {
          _selectedDirNode = this.treverseNode;
        }

        var _radio = registry.byNode(query('.jimu-radio', _selectedDirNode)[0]);
        _radio.check(true);
      },

      _updateWGSOpt: function(){
        var _selectedOptNode = null;
        var _Opt = this.get('wgs84Opt');
        if (_Opt === 'dd') {
          _selectedOptNode = this.wgsOptDD;
        } else if (_Opt === 'dms') {
          _selectedOptNode = this.wgsOptDMS;
        } else if (_Opt === 'dm') {
          _selectedOptNode = this.wgsOptDM;
        } else {
          _selectedOptNode = this.wgsOptDDM;
        }

        var _radio = registry.byNode(query('.jimu-radio', _selectedOptNode)[0]);
        _radio.check(true);
      },

      getConfig: function(){
        var fwgs84Opt;
        if(this.currentWkid === 4326){
          fwgs84Opt = this.wgs84Opt;
        }else{
          fwgs84Opt = '';
        }
        var config = {
          wkid: utils.standardizeWkid(this.wkid.get('value')),
          name: this.unitnameTB.get('value'),
          example: this.unitExampleTB.get('value'),
          xlabel: this.unitXLabelTB.get('value'),
          ylabel: this.unitYLabelTB.get('value'),
          wgs84option: fwgs84Opt
        };
        if(this.currentTfWkid){
          config.tfwkid = this.currentTfWkid;
          config.transformDirection = this.transformDir;
        }
        this.config = config;
        return [this.config, this.tr];
      },

      _setConfig: function(config) {
        this._config = lang.clone(config);

        utils.loadResource().then(lang.hitch(this, function() {
          if (config && config.wkid) {
            if(config.tfwkid){
              this.tfwkid.set('value', parseInt(config.tfwkid, 10));
              this.currentTfWkid = parseInt(config.tfwkid, 10);
              this.set('transformDir', config.transformDirection);
            }
            this.wkid.set('value', parseInt(config.wkid, 10));
            this.currentWkid = parseInt(config.wkid, 10);
            this.unitnameTB.set('value', lang.trim(config.name));
            this.unitExampleTB.set('value', lang.trim(config.example));
            this.unitXLabelTB.set('value', lang.trim(config.xlabel));
            this.unitYLabelTB.set('value', lang.trim(config.ylabel));
            if(this.currentWkid === 4326){
              this.set('wgs84Opt', config.wgs84option);
            }
          }
        }), lang.hitch(this, function(err) {
          console.error(err);
        }));
      },

      onTfWkidChange: function(newValue) {
        var label = "",
          newTfWkid = parseInt(newValue, 10);
        if (utils.isValidTfWkid(newTfWkid)) {
          label = utils.getTransformationLabel(newTfWkid);
          this.tfwkidLabel.innerHTML = label;
        }
        this.currentTfWkid = newTfWkid;
      },

      onWkidChange: function(newValue) {
        var label = "",
          newWkid = parseInt(newValue, 10);

        this.popup.disableButton(0);

        if (utils.isValidWkid(newWkid)) {
          label = utils.getSRLabel(newWkid);
          this.wkidLabel.innerHTML = label;
          if(this.unitnameTB.get('value') === ""){
            this.unitnameTB.set('value', label.split("_").join(" "));
          }
          if(this.unitXLabelTB.get('value') === ""){
            if(utils.isGeographicCS(newWkid)){
              this.unitXLabelTB.set('value', this.nls.geox);
            }else{
              this.unitXLabelTB.set('value', this.nls.projx);
            }
          }
          if(this.unitYLabelTB.get('value') === ""){
            if(utils.isGeographicCS(newWkid)){
              this.unitYLabelTB.set('value', this.nls.geoy);
            }else{
              this.unitYLabelTB.set('value', this.nls.projy);
            }
          }
          this.popup.enableButton(0);
          if(newWkid === 4326){
            domStyle.set(this.unitWkid4326Ops1, 'display', '');
            domStyle.set(this.unitWkid4326Ops2, 'display', '');
          }else{
            domStyle.set(this.unitWkid4326Ops1, 'display', 'none');
            domStyle.set(this.unitWkid4326Ops2, 'display', 'none');
          }
        } else if (newValue) {
          this.wkid.set('value', "");
          this.wkidLabel.innerHTML = this.nls.cName;
          domStyle.set(this.unitWkid4326Ops1, 'display', 'none');
          domStyle.set(this.unitWkid4326Ops2, 'display', 'none');
        }
        this.currentWkid = newWkid;
      }
    });
  });
