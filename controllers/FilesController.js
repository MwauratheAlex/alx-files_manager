class FilesController {
  static async postUpload(_, res) {
    return res.status(200).json('hello world');
  }
}

export default FilesController;
