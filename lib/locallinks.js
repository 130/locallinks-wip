var locallinks = localinks = (function(){
  var _storage = {};

  _storage.get = function(key) {
    var key_components = key.split(".");
    var local_storage_key = key_components.shift();
    var stored_value = JSON.parse(localStorage.getItem(local_storage_key));

    if (_(stored_value).isNull())
    {
      return undefined;
    }

    var value = stored_value;
    var inner_object_key = key_components.shift();
    while (!_(inner_object_key).isUndefined())
    {
      if (!value.hasOwnProperty(inner_object_key))
      {
        return undefined;
      }

      value = value[inner_object_key];
      inner_object_key = key_components.shift();
    }

    return value;
  };

  _storage.set = function(key, value){
    var key_components = key.split(".");
    var local_storage_key = key_components.shift();

    if (_(key_components).isEmpty())
    {
      localStorage.setItem(local_storage_key, JSON.stringify(value));
      return;
    }

    var stored = JSON.parse(localStorage.getItem(local_storage_key));
    if (_(stored).isNull())
    {
      stored = {};
    }

    var inner_object = stored;
    var inner_object_key = key_components.shift();
    while (!_(key_components).isEmpty())
    {
      if (!inner_object.hasOwnProperty(inner_object_key))
      {
        inner_object[inner_object_key] = {};
      }

      inner_object = inner_object[inner_object_key];
      inner_object_key = key_components.shift();
    }
    inner_object[inner_object_key] = value;

    localStorage.setItem(local_storage_key, JSON.stringify(stored));
  };

  _storage.remove = function(key) {
    var key_components = key.split(".");
    var local_storage_key = key_components.shift();

    if (_(key_components).isEmpty())
    {
      localStorage.removeItem(local_storage_key);
      return;
    }

    var stored = JSON.parse(localStorage.getItem(local_storage_key));
    if (_(stored).isNull())
    {
      return;
    }

    var inner_object = stored;
    var inner_object_key = key_components.shift();
    while (!_(key_components).isEmpty())
    {
      if (!inner_object.hasOwnProperty(inner_object_key))
      {
        return;
      }

      inner_object = inner_object[inner_object_key];
      inner_object_key = key_components.shift();
    }
    delete inner_object[inner_object_key];

    localStorage.setItem(local_storage_key, JSON.stringify(stored));
  };

  return {
    storage: _storage,
  };
})();
