"use client";
import React, { Component } from "react";
import _ from "lodash";
import PropTypes from "prop-types";
import initRDKitModule from "@rdkit/rdkit";

const initRDKit = (() => {
  let rdkitLoadingPromise;
  let rdkitInstance;
  
  return {
    load: () => {
      // If we already have a loaded instance, return it immediately
      if (rdkitInstance) {
        return Promise.resolve(rdkitInstance);
      }
      
      // If there's already a loading promise in progress, return it
      if (rdkitLoadingPromise) {
        return rdkitLoadingPromise;
      }
      
      // Create new loading promise
      rdkitLoadingPromise = new Promise((resolve, reject) => {
        initRDKitModule()
          .then((RDKit) => {
            rdkitInstance = RDKit;
            rdkitLoadingPromise = null;
            resolve(RDKit);
          })
          .catch((e) => {
            rdkitLoadingPromise = null; // Clear promise on failure to allow retry
            reject(e);
          });
      });
      
      return rdkitLoadingPromise;
    },
    clearCache: () => {
      // Clear cached promise and instance to force reload
      rdkitLoadingPromise = null;
      rdkitInstance = null;
    }
  };
})();

class MoleculeStructure extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    className: PropTypes.string,
    svgMode: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    structure: PropTypes.string.isRequired,
    subStructure: PropTypes.string,
    extraDetails: PropTypes.object,
    drawingDelay: PropTypes.number,
    scores: PropTypes.number,
  };

  static defaultProps = {
    subStructure: "",
    className: "",
    width: 250,
    height: 200,
    svgMode: false,
    extraDetails: {},
    drawingDelay: undefined,
    scores: 0,
  };

  constructor(props) {
    super(props);

    this.MOL_DETAILS = {
      width: this.props.width,
      height: this.props.height,
      bondLineWidth: 1,
      addStereoAnnotation: true,
      ...this.props.extraDetails,
    };

    this.state = {
      svg: undefined,
      rdKitLoaded: false,
      rdKitError: false,
      retryCount: 0,
      isRetrying: false,
    };
    
    this.maxRetries = 3;
    this.retryTimeouts = [];
  }

  drawOnce = (() => {
    let wasCalled = false;

    return () => {
      if (!wasCalled) {
        wasCalled = true;
        this.draw();
      }
    };
  })();

  draw() {
    if (this.props.drawingDelay) {
      setTimeout(() => {
        this.drawSVGorCanvas();
      }, this.props.drawingDelay);
    } else {
      this.drawSVGorCanvas();
    }
  }

  drawSVGorCanvas() {
    const mol = this.RDKit.get_mol(this.props.structure || "invalid");
    const qmol = this.RDKit.get_qmol(this.props.subStructure || "invalid");
    const isValidMol = this.isValidMol(mol);

    if (this.props.svgMode && isValidMol) {
      const svg = mol.get_svg_with_highlights(this.getMolDetails(mol, qmol));
      this.setState({ svg });
    } else if (isValidMol) {
      const canvas = document.getElementById(this.props.id);
      mol.draw_to_canvas_with_highlights(canvas, this.getMolDetails(mol, qmol));
    }

    mol?.delete();
    qmol?.delete();
  }

  isValidMol(mol) {
    return !!mol;
  }

  getMolDetails(mol, qmol) {
    if (this.isValidMol(mol) && this.isValidMol(qmol)) {
      const subStructHighlightDetails = JSON.parse(
        mol.get_substruct_matches(qmol),
      );
      const subStructHighlightDetailsMerged = !_.isEmpty(
        subStructHighlightDetails,
      )
        ? subStructHighlightDetails.reduce(
            (acc, { atoms, bonds }) => ({
              atoms: [...acc.atoms, ...atoms],
              bonds: [...acc.bonds, ...bonds],
            }),
            { bonds: [], atoms: [] },
          )
        : subStructHighlightDetails;
      return JSON.stringify({
        ...this.MOL_DETAILS,
        ...(this.props.extraDetails || {}),
        ...subStructHighlightDetailsMerged,
      });
    } else {
      return JSON.stringify({
        ...this.MOL_DETAILS,
        ...(this.props.extraDetails || {}),
      });
    }
  }

  loadRDKit = (isRetry = false) => {
    if (isRetry) {
      this.setState({ isRetrying: true, rdKitError: false });
    }
    
    initRDKit.load()
      .then((RDKit) => {
        this.RDKit = RDKit;
        this.setState({ 
          rdKitLoaded: true, 
          rdKitError: false, 
          retryCount: 0,
          isRetrying: false 
        });
        try {
          this.draw();
        } catch (err) {
          console.error("Error drawing molecule:", err);
        }
      })
      .catch((err) => {
        console.error("Error loading RDKit:", err);
        const { retryCount } = this.state;
        
        // Auto-retry with exponential backoff
        if (retryCount < this.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`Retrying RDKit load in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
          
          const timeout = setTimeout(() => {
            initRDKit.clearCache(); // Clear cache before retry
            this.setState({ retryCount: retryCount + 1 });
            this.loadRDKit(true);
          }, delay);
          
          this.retryTimeouts.push(timeout);
        } else {
          // Max retries reached
          this.setState({ 
            rdKitError: true, 
            isRetrying: false 
          });
        }
      });
  };

  handleManualRetry = () => {
    // Clear all pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts = [];
    
    // Reset state and clear cache
    initRDKit.clearCache();
    this.setState({ 
      retryCount: 0, 
      rdKitError: false,
      isRetrying: false 
    });
    
    // Attempt to load
    this.loadRDKit(true);
  };

  componentDidMount() {
    this.loadRDKit();
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts = [];
  }

  componentDidUpdate(prevProps) {
    if (
      !this.state.rdKitError &&
      this.state.rdKitLoaded &&
      !this.props.svgMode
    ) {
      this.drawOnce();
    }

    if (this.state.rdKitLoaded) {
      const shouldUpdateDrawing =
        prevProps.structure !== this.props.structure ||
        prevProps.svgMode !== this.props.svgMode ||
        prevProps.subStructure !== this.props.subStructure ||
        prevProps.width !== this.props.width ||
        prevProps.height !== this.props.height ||
        !_.isEqual(prevProps.extraDetails, this.props.extraDetails);

      if (shouldUpdateDrawing) {
        this.draw();
      }
    }
  }

  render() {
    if (this.state.rdKitError) {
      return (
        <div 
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          style={{ width: this.props.width, height: this.props.height }}
        >
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">Error loading renderer</p>
          <button
            onClick={this.handleManualRetry}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    
    if (!this.state.rdKitLoaded) {
      const { isRetrying, retryCount } = this.state;
      return (
        <div 
          className="flex items-center justify-center p-4"
          style={{ width: this.props.width, height: this.props.height }}
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isRetrying ? `Retrying (${retryCount}/${this.maxRetries})...` : "Loading renderer..."}
            </p>
          </div>
        </div>
      );
    }

    const mol = this.RDKit.get_mol(this.props.structure || "invalid");
    const isValidMol = this.isValidMol(mol);
    mol?.delete();

    if (!isValidMol) {
      return (
        <span title={`Cannot render structure: ${this.props.structure}`}>
          Render Error.
        </span>
      );
    } else if (this.props.svgMode) {
      return (
        <div
          title={this.props.structure}
          className={"molecule-structure-svg " + (this.props.className || "")}
          style={{ width: this.props.width, height: this.props.height }}
          dangerouslySetInnerHTML={{ __html: this.state.svg }}
        ></div>
      );
    } else {
      return (
        <div
          className={
            "molecule-canvas-container " + (this.props.className || "")
          }
        >
          <canvas
            title={this.props.structure}
            id={this.props.id}
            width={this.props.width}
            height={this.props.height}
          ></canvas>
          {this.props.scores ? (
            <p className="text-red-600 z-50 p-10">
              Score: {this.props.scores.toFixed(2)}
            </p>
          ) : (
            ""
          )}
        </div>
      );
    }
  }
}

export default MoleculeStructure;
