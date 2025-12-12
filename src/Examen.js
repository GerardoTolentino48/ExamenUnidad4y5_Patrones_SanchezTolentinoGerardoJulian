class GestorJuego
{
    constructor()
    {
        if (GestorJuego.instancia)
        {
            return GestorJuego.instancia;
        }
        this.poblacin = 0;
        this.edificios = 0;
        this.vehiculos = 0;
        this.recursos = 1000;
        this.objetosActivos = [];
        this.vista = null;

        GestorJuego.instancia = this;
        this.actualizarInterfaz();
    }

    static obtenerInstancia()
    {
        if (!GestorJuego.instancia)
        {
            GestorJuego.instancia = new GestorJuego();
        }
        return GestorJuego.instancia;
    }

    setVista(vista)
    {
        this.vista = vista;
        this.actualizarInterfaz();
    }

    agregarObjeto(obj)
    {
        this.objetosActivos.push(obj);
        this.actualizarEstadisticas();
        this.actualizarInterfaz();
    }

    removerObjeto(obj)
    {
        const indice = this.objetosActivos.indexOf(obj);
        if (indice > -1)
        {
            this.objetosActivos.splice(indice, 1);
            this.actualizarEstadisticas();
            this.actualizarInterfaz();
        }
    }

    actualizarEstadisticas()
    {
        this.poblacion = this.objetosActivos.filter(obj => obj.tipo === 'ciudadano').length;
        this.edificios = this.objetosActivos.filter(obj => obj.tipo === 'edificio').length;
        this.vehiculos = this.objetosActivos.filter(obj => obj.tipo === 'vehiculo').length;
    }

    actualizarInterfaz()
    {
        if (this.vista)
        {
            this.vista.actualizarInterfaz(this);
        }
        else
        {
            document.getElementById('poblacion').textContent = this.poblacion;
            document.getElementById('edificios').textContent = this.edificios;
            document.getElementById('vehiculos').textContent = this.vehiculos;
            document.getElementById('recursos').textContent = this.recursos;
        }
    }

    reciclarTodo()
    {
        this.objetosActivos.forEach(obj =>
        {
            obj.reciclar();
        });
        this.objetosActivos = [];
        this.actualizarEstadisticas();
        this.actualizarInterfaz();
    }

    guardarEstado()
    {
        const objetosInfo = this.objetosActivos.map(obj => ({
            tipo: obj.tipo,
            x: obj.x,
            y: obj.y
        }));
        return {
            recursos: this.recursos,
            poblacion: this.poblacion,
            edificios: this.edificios,
            vehiculos: this.vehiculos,
            objetos: objetosInfo
        };
    }

    restaurarEstado(memento, poolEdificios, poolVehiculos, poolCiudadanos)
    {
        this.objetosActivos.forEach(obj => {
            obj.reciclar();
            if (obj.tipo === 'edificio') {
                poolEdificios.liberar(obj);
            } else if (obj.tipo === 'vehiculo') {
                poolVehiculos.liberar(obj);
            } else if (obj.tipo === 'ciudadano') {
                poolCiudadanos.liberar(obj);
            }
        });
        this.objetosActivos = [];

        this.recursos = memento.recursos;
        this.poblacion = memento.poblacion;
        this.edificios = memento.edificios;
        this.vehiculos = memento.vehiculos;

        if (memento.objetos) {
            memento.objetos.forEach(objInfo => {
                let obj = null;
                if (objInfo.tipo === 'edificio') {
                    obj = poolEdificios.obtener();
                } else if (objInfo.tipo === 'vehiculo') {
                    obj = poolVehiculos.obtener();
                } else if (objInfo.tipo === 'ciudadano') {
                    obj = poolCiudadanos.obtener();
                }
                
                if (obj) {
                    obj.activar(objInfo.x, objInfo.y);
                    this.agregarObjeto(obj);
                }
            });
        }
        
        this.actualizarInterfaz();
    }
}

class PoolObjetos
{
    constructor(funcionCrear, funcionReset, tamanoInicial = 5)
    {
        this.funcionCrear = funcionCrear;
        this.funcionReset = funcionReset;
        this.pool = [];
        this.activos = [];
        
        for (let i = 0; i < tamanoInicial; i++)
        {
            this.pool.push(this.funcionCrear());
        }
    }

    obtener()
    {
        if (this.pool.length === 0)
        {
            return null;
        }
        
        const obj = this.pool.pop();
        this.activos.push(obj);
        return obj;
    }

    liberar(obj)
    {
        const indice = this.activos.indexOf(obj);
        if (indice > -1)
        {
            this.activos.splice(indice, 1);
            this.funcionReset(obj);
            this.pool.push(obj);
        }
    }

    obtenerTamanoPool()
    {
        return this.pool.length;
    }

    obtenerTamanoActivos()
    {
        return this.activos.length;
    }
}

class RenderizadorDOM
{
    crearElemento(tipo, etiqueta, x, y)
    {
        const elemento = document.createElement('div');
        elemento.className = tipo;
        elemento.style.left = x + 'px';
        elemento.style.top = y + 'px';
        elemento.innerHTML = etiqueta;
        document.getElementById('areaCiudad').appendChild(elemento);
        return elemento;
    }

    eliminarElemento(elemento)
    {
        if (elemento)
        {
            elemento.remove();
        }
    }
}

class ObjetoJuego
{
    constructor(tipo, etiqueta, renderizador)
    {
        this.tipo = tipo;
        this.etiqueta = etiqueta;
        this.renderizador = renderizador;
        this.elemento = null;
        this.estaActivo = false;
        this.x = 0;
        this.y = 0;
    }

    activar(x, y)
    {
        this.estaActivo = true;
        this.x = x;
        this.y = y;
        this.crearElemento();
        return this;
    }

    crearElemento()
    {
        this.elemento = this.renderizador.crearElemento(this.tipo, this.etiqueta, this.x, this.y);
    }

    reciclar()
    {
        this.renderizador.eliminarElemento(this.elemento);
        this.estaActivo = false;
        this.elemento = null;
    }
}

class Edificio extends ObjetoJuego
{
    constructor(renderizador)
    {
        super('edificio', 'EDIFICIO', renderizador);
    }
}

class Vehiculo extends ObjetoJuego
{
    constructor(renderizador)
    {
        super('vehiculo', 'VEHÍCULO', renderizador);
    }
}

class Ciudadano extends ObjetoJuego
{
    constructor(renderizador)
    {
        super('ciudadano', 'CIUDADANO', renderizador);
    }
}

// ===== Vista =====
class JuegoVista
{
    actualizarInterfaz(modelo)
    {
        document.getElementById('poblacion').textContent = modelo.poblacion;
        document.getElementById('edificios').textContent = modelo.edificios;
        document.getElementById('vehiculos').textContent = modelo.vehiculos;
        document.getElementById('recursos').textContent = modelo.recursos;
    }

    actualizarVisualizacionPool(poolEdificios, poolVehiculos, poolCiudadanos)
    {
        this.actualizarSeccionPool('edificioPool', poolEdificios, 'EDIFICIO');
        this.actualizarSeccionPool('vehiculoPool', poolVehiculos, 'VEHÍCULO');
        this.actualizarSeccionPool('ciudadanoPool', poolCiudadanos, 'CIUDADANO');
    }

    actualizarSeccionPool(idContenedor, pool, texto)
    {
        const contenedor = document.getElementById(idContenedor);
        contenedor.innerHTML = '';
        
        for (let i = 0; i < pool.obtenerTamanoPool(); i++)
        {
            const itemPool = document.createElement('div');
            itemPool.className = 'item-pool';
            itemPool.innerHTML = texto;
            contenedor.appendChild(itemPool);
        }
    }
}

// ===== Controller =====
class JuegoControlador
{
    constructor(gestor, vista, poolEdificios, poolVehiculos, poolCiudadanos)
    {
        this.gestor = gestor;
        this.vista = vista;
        this.poolEdificios = poolEdificios;
        this.poolVehiculos = poolVehiculos;
        this.poolCiudadanos = poolCiudadanos;
        this.costoEdificio = 200;
        this.costoVehiculo = 100;
        this.costoCiudadano = 50;
        this.mementoEstado = null;
        this.inicializarEventos();
        this.vista.actualizarVisualizacionPool(this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
    }

    obtenerPosicionAleatoria()
    {
        const areaCiudad = document.getElementById('areaCiudad');
        const rectangulo = areaCiudad.getBoundingClientRect();
        return {
            x: Math.random() * (rectangulo.width - 50),
            y: Math.random() * (rectangulo.height - 50)
        };
    }

    comprobarSingleton()
    {
        const instanciaUno = GestorJuego.obtenerInstancia();
        const instanciaDos = GestorJuego.obtenerInstancia();
        const esSingleton = (instanciaUno === instanciaDos);
        
        const mensaje = `COMPROBACIÓN DE SINGLETON:\n\n` +
                      `¿Son la misma instancia? ${esSingleton ? 'SÍ' : 'NO'}\n\n` +
                      `Singleton OK: ${esSingleton}\n\n`;
        
        alert(mensaje);
    }

    inicializarEventos()
    {
        document.getElementById('agregaredificio').addEventListener('click', () =>
        {
            if (this.gestor.recursos < this.costoEdificio)
            {
                return;
            }

            const posicion = this.obtenerPosicionAleatoria();
            const edificio = this.poolEdificios.obtener();
            
            if (edificio === null)
            {
                return;
            }
            
            this.gestor.recursos -= this.costoEdificio;
            edificio.activar(posicion.x, posicion.y);
            this.gestor.agregarObjeto(edificio);
            this.gestor.actualizarInterfaz();
            this.vista.actualizarVisualizacionPool(this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
        });

        document.getElementById('addVehicle').addEventListener('click', () =>
        {
            if (this.gestor.recursos < this.costoVehiculo)
            {
                return;
            }

            const posicion = this.obtenerPosicionAleatoria();
            const vehiculo = this.poolVehiculos.obtener();
            
            if (vehiculo === null)
            {
                return;
            }
            
            this.gestor.recursos -= this.costoVehiculo;
            vehiculo.activar(posicion.x, posicion.y);
            this.gestor.agregarObjeto(vehiculo);
            this.gestor.actualizarInterfaz();
            this.vista.actualizarVisualizacionPool(this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
        });

        document.getElementById('agregarciudadano').addEventListener('click', () =>
        {
            if (this.gestor.recursos < this.costoCiudadano)
            {
                return;
            }

            const posicion = this.obtenerPosicionAleatoria();
            const ciudadano = this.poolCiudadanos.obtener();
            
            if (ciudadano === null)
            {
                return;
            }
            
            this.gestor.recursos -= this.costoCiudadano;
            ciudadano.activar(posicion.x, posicion.y);
            this.gestor.agregarObjeto(ciudadano);
            this.gestor.actualizarInterfaz();
            this.vista.actualizarVisualizacionPool(this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
        });

        document.getElementById('removeBuilding').addEventListener('click', () => {
            const edificiosActivos = this.gestor.objetosActivos.filter(obj => obj.tipo === 'edificio');
            
            if (edificiosActivos.length === 0)
            {
                return;
            }
            
            const edificioAQuitar = edificiosActivos[edificiosActivos.length - 1];
            this.gestor.recursos += Math.floor(this.costoEdificio * 0.5);
            this.poolEdificios.liberar(edificioAQuitar);
            this.gestor.removerObjeto(edificioAQuitar);
            this.gestor.actualizarInterfaz();
            this.vista.actualizarVisualizacionPool(this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
        });

        document.getElementById('removeVehicle').addEventListener('click', () =>
        {
            const vehiculosActivos = this.gestor.objetosActivos.filter(obj => obj.tipo === 'vehiculo');
            
            if (vehiculosActivos.length === 0)
            {
                return;
            }
            
            const vehiculoAQuitar = vehiculosActivos[vehiculosActivos.length - 1];
            this.gestor.recursos += Math.floor(this.costoVehiculo * 0.5);
            this.poolVehiculos.liberar(vehiculoAQuitar);
            this.gestor.removerObjeto(vehiculoAQuitar);
            this.gestor.actualizarInterfaz();
            this.vista.actualizarVisualizacionPool(this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
        });

        document.getElementById('removeCitizen').addEventListener('click', () =>
        {
            const ciudadanosActivos = this.gestor.objetosActivos.filter(obj => obj.tipo === 'ciudadano');
            
            if (ciudadanosActivos.length === 0)
            {
                return;
            }
            
            const ciudadanoAQuitar = ciudadanosActivos[ciudadanosActivos.length - 1];
            this.gestor.recursos += Math.floor(this.costoCiudadano * 0.5);
            this.poolCiudadanos.liberar(ciudadanoAQuitar);
            this.gestor.removerObjeto(ciudadanoAQuitar);
            this.gestor.actualizarInterfaz();
            this.vista.actualizarVisualizacionPool(this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
        });

        document.getElementById('recycleAll').addEventListener('click', () =>
        {
            let recursosADevolver = 0;
            this.gestor.objetosActivos.forEach(obj =>
            {
                if (obj.tipo === 'edificio')
                {
                    recursosADevolver += Math.floor(this.costoEdificio * 0.5);
                } else if (obj.tipo === 'vehiculo')
                {
                    recursosADevolver += Math.floor(this.costoVehiculo * 0.5);
                } else if (obj.tipo === 'ciudadano')
                {
                    recursosADevolver += Math.floor(this.costoCiudadano * 0.5);
                }
            });
            
            this.gestor.objetosActivos.forEach(obj => {
                if (obj.tipo === 'edificio')
                {
                    this.poolEdificios.liberar(obj);
                } else if (obj.tipo === 'vehiculo')
                {
                    this.poolVehiculos.liberar(obj);
                } else if (obj.tipo === 'ciudadano')
                {
                    this.poolCiudadanos.liberar(obj);
                }
            });
            
            this.gestor.recursos += recursosADevolver;
            this.gestor.reciclarTodo();
            this.gestor.actualizarInterfaz();
            this.vista.actualizarVisualizacionPool(this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
        });

        document.getElementById('testSingleton').addEventListener('click', () =>
        {
            this.comprobarSingleton();
        });

        document.getElementById('guardarEstado').addEventListener('click', () =>
        {
            this.mementoEstado = this.gestor.guardarEstado();
            alert('Estado guardado correctamente');
        });

        document.getElementById('restaurarEstado').addEventListener('click', () =>
        {
            if (this.mementoEstado)
            {
                this.gestor.restaurarEstado(this.mementoEstado, this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
                this.vista.actualizarVisualizacionPool(this.poolEdificios, this.poolVehiculos, this.poolCiudadanos);
                alert('Estado restaurado correctamente');
            } 
            else 
            {
                alert('No hay estado guardado');
            }
        });
    }
}

const gestorJuego = GestorJuego.obtenerInstancia();
const renderizadorDOM = new RenderizadorDOM();
const vista = new JuegoVista();
gestorJuego.setVista(vista);

const poolEdificios = new PoolObjetos(
    () => new Edificio(renderizadorDOM),
    (obj) => obj.reciclar(),
    5
);

const poolVehiculos = new PoolObjetos(
    () => new Vehiculo(renderizadorDOM),
    (obj) => obj.reciclar(),
    5
);

const poolCiudadanos = new PoolObjetos(
    () => new Ciudadano(renderizadorDOM),
    (obj) => obj.reciclar(),
    5
);

new JuegoControlador(gestorJuego, vista, poolEdificios, poolVehiculos, poolCiudadanos);
vista.actualizarVisualizacionPool(poolEdificios, poolVehiculos, poolCiudadanos);

