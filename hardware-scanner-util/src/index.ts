import  ScanUtil  from './core/ScanUtil'

/** This keeps compatibility with Typescript default imports */
export default ScanUtil;

/** 
 * This is janky, and I don't like it, but it works with Javascript require as a "default" import.
 * This is not necessary if using this module with Typescript.
 */
module.exports = ScanUtil;