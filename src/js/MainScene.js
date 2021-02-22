import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor (field) {
        super();
        this.field = field;
        this.constructions = {};
    }

    init(data) {

    }

    preload () {
        this.load.setBaseURL('./');
        this.load.image('road_0011', 'road_0011.png');
        this.load.image('road_0101', 'road_0101.png');
        this.load.image('road_0110', 'road_0110.png');
        this.load.image('road_0111', 'road_0111.png');
        this.load.image('road_1001', 'road_1001.png');
        this.load.image('road_1010', 'road_1010.png');
        this.load.image('road_1011', 'road_1011.png');
        this.load.image('road_1100', 'road_1100.png');
        this.load.image('road_1101', 'road_1101.png');
        this.load.image('road_1110', 'road_1110.png');
        this.load.image('road_1111', 'road_1111.png');
        this.load.image('building_1x1x1_1', 'building_1x1x1_1.png');
        this.load.image('building_1x1x1_2', 'building_1x1x1_2.png');
        this.load.image('building_1x1x2_1', 'building_1x1x2_1.png');
    }

    create (data)  {
        console.log('Scene intialized.');
        this.drawGrid(this); //antipattern

        this.input.mouse.disableContextMenu();

        this.input.on('pointerup', (pointer) => {
            this.handleCellClick(pointer.worldX, pointer.worldY, pointer);
        });

        this.cameras.main.zoom = 2;

        const cameraControlParams = {
            camera: this.cameras.main,
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            acceleration: 0.25, // originally was 0.06
            drag: 0.002, // originally was 0.0005
            maxSpeed: 0.25 // originally was 1.0
        };
    
        this.cameraControls = new Phaser.Cameras.Controls.SmoothedKeyControl(cameraControlParams);
    }

    update(time, delta) {
        this.field.iterateBuildQueue((tile) => {
            const pixelPosition = this.getCellPosition(tile.getRow(), tile.getCol());
            const identifier = `${tile.getRow()}-${tile.getCol()}`;

            if(this.constructions[identifier]) {
                this.constructions[identifier].destroy();
                delete this.constructions[identifier];
            }

            const textureName = tile.getTextureName();
            if(textureName !== null){
                this.constructions[identifier] = this.add.image(pixelPosition.x, pixelPosition.y, tile.getTextureName());
            }
        });

        this.cameraControls.update(delta);
       //console.log(`Update: ${time}`);
    }

    // gets cell center position in pixels given a specific row and col
    getCellPosition(row, col){
        let cellPositions = null;

        if(row >= 0 && row < this.field.getRows()){
            const yEdge = this.gridParams.bounds.top + (row * this.gridParams.cells.height);
            const yCenter = yEdge + (this.gridParams.cells.height / 2);
    
            const xEdge = this.gridParams.bounds.left + (col * this.gridParams.cells.width);
            const xCenter = xEdge + (this.gridParams.cells.width / 2);
    
            cellPositions = {
                x: xCenter,
                y: yCenter
            };
        }
    
        return cellPositions;
    }

    // gets tile position in row and col given X and Y in pixels
    getTilePosition(pixelX, pixelY){
        const belowTop = pixelY > this.gridParams.bounds.top;
        const aboveBottom = pixelY < this.gridParams.bounds.bottom;
        const afterLeft = pixelX > this.gridParams.bounds.left;
        const beforeRight = pixelX < this.gridParams.bounds.right;

        let position = null;

        if(belowTop && aboveBottom && afterLeft && beforeRight){
            const distance = {
                top: pixelY - this.gridParams.bounds.top,
                left: pixelX - this.gridParams.bounds.left
            };
            
            const row = Math.floor(distance.top / this.gridParams.cells.height);
            const col = Math.floor(distance.left / this.gridParams.cells.width); 

            position = {row, col};
        }

        return position;
    }

    handleCellClick(clickedX, clickedY, clickEvent){
        const position = this.getTilePosition(clickedX, clickedY);
        if(position){
            this.field.handleTileClick(position.row, position.col, clickEvent.button);
        }
    }

    setScreenParams(screenWidth, screenHeight){
        this.screenParams = {
            width: screenWidth,
            height: screenHeight,
            horizontalCenter: screenWidth / 2,
            verticalCenter: screenHeight / 2,
        };
    }

    setGridParams(rows, cols, gridWidth, gridHeight){
        this.gridParams = {
            width: gridWidth,
            height: gridHeight,

            rows: rows,
            cols: cols,

            cells: {
                width: gridWidth / cols,
                height: gridHeight / rows,
            }
        };
    }

    drawGrid(scene) {
        const backgroundColor = 0x057605;

        this.grid = scene.add.grid(
            this.screenParams.horizontalCenter, 
            this.screenParams.verticalCenter, 
            this.gridParams.width, 
            this.gridParams.height,
            this.gridParams.cells.width, 
            this.gridParams.cells.height, 
            backgroundColor
        );
        
        this.gridParams.bounds = this.grid.getBounds();
    }

}